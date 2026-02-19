import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/security/password";
import { logEvent } from "@/lib/data/events";

// ---------------------------------------------------------------------------
// Custom adapter: wraps PrismaAdapter to handle OAuth user creation
// ---------------------------------------------------------------------------

function createAdapter() {
  const base = PrismaAdapter(db);

  return {
    ...base,
    async createUser(data: { name?: string | null; email: string; emailVerified?: Date | null; image?: string | null }) {
      // For Discord users without verified email, generate a unique placeholder
      // to avoid unique constraint violations on the email column
      const email = data.email || `discord_noemail_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@placeholder.invalid`;

      // Generate a username from the email prefix
      const prefix = email
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 20) || "user";

      let username = prefix;
      // Check if username is taken; if so, append random suffix
      const existing = await db.user.findUnique({
        where: { username },
        select: { id: true },
      });
      if (existing) {
        const suffix = Math.floor(1000 + Math.random() * 9000); // 4-digit
        username = `${prefix}_${suffix}`;
      }

      const user = await db.user.create({
        data: {
          displayName: data.name ?? null,
          email,
          emailVerified: data.emailVerified ?? null,
          avatar: data.image ?? null,
          username,
          onboardingComplete: false,
          onboardingStep: 0,
        },
      });

      console.log(`[auth] created_new_user: id=${user.id}, username=${username}, email=${email.includes("@placeholder.invalid") ? "placeholder" : "provider"}`);

      return {
        id: user.id,
        name: user.displayName,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.avatar,
        role: "USER" as const,
        username: user.username,
        verificationTier: "UNVERIFIED" as const,
        onboardingComplete: user.onboardingComplete,
      };
    },
    async linkAccount(account: any) {
      console.log(`[auth] linked_account: provider=${account.provider}, userId=${account.userId}`);
      return base.linkAccount!(account);
    },
  } as NextAuthConfig["adapter"];
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

const providers: NextAuthConfig["providers"] = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const login = (credentials.email as string).toLowerCase().trim();
      const password = credentials.password as string;

      // Allow login with either email or username
      const isEmail = login.includes("@");
      const user = await db.user.findFirst({
        where: isEmail
          ? { email: login }
          : { username: { equals: login, mode: "insensitive" } },
        select: {
          id: true,
          email: true,
          emailVerified: true,
          passwordHash: true,
          username: true,
          displayName: true,
          avatar: true,
          role: true,
          verificationTier: true,
          onboardingComplete: true,
        },
      });

      if (!user || !user.passwordHash) {
        await logEvent("LOGIN_FAILED", {
          metadata: { provider: "credentials", reason: "user_not_found" },
        });
        return null;
      }

      const isValid = await verifyPassword(password, user.passwordHash);

      if (!isValid) {
        await logEvent("LOGIN_FAILED", {
          userId: user.id,
          metadata: { provider: "credentials", reason: "invalid_password" },
        });
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.displayName ?? user.username,
        image: user.avatar,
        role: user.role,
        username: user.username,
        verificationTier: user.verificationTier,
        onboardingComplete: user.onboardingComplete,
      };
    },
  }),
];

// Google OAuth
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "select_account",
        },
      },
      allowDangerousEmailAccountLinking: true,
    })
  );
}

// Discord OAuth
if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  providers.push(
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "identify email",
        },
      },
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        // Strip email for unverified Discord accounts to prevent
        // the adapter from email-matching to an existing user
        return {
          id: profile.id,
          name: profile.global_name ?? profile.username,
          email: profile.verified ? profile.email : null,
          image: profile.avatar
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
            : null,
          // Required by extended User type — actual values loaded from DB in jwt callback
          role: "USER" as const,
          username: "",
          verificationTier: "UNVERIFIED" as const,
          onboardingComplete: false,
        };
      },
    })
  );
}

// ---------------------------------------------------------------------------
// Auth config
// ---------------------------------------------------------------------------

const authConfig: NextAuthConfig = {
  adapter: createAdapter(),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
    error: "/login",
  },
  trustHost: true,
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (user.id) {
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { riskScore: true, emailVerified: true, onboardingComplete: true },
        });

        // Block banned users (riskScore >= 100)
        if (dbUser && dbUser.riskScore >= 100) {
          return false;
        }

        // Block unverified credential logins (OAuth users are not affected)
        if (
          account?.provider === "credentials" &&
          dbUser &&
          !dbUser.emailVerified
        ) {
          return "/login?error=EmailNotVerified";
        }

        // Redirect OAuth users who haven't completed onboarding to set their handle
        if (
          account?.provider !== "credentials" &&
          dbUser &&
          !dbUser.onboardingComplete
        ) {
          return "/complete-profile";
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Allow relative paths
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // Allow same-origin absolute URLs
      try {
        if (new URL(url).origin === baseUrl) {
          return url;
        }
      } catch {
        // Invalid URL — fall through to default
      }
      // Reject everything else
      return `${baseUrl}/builds`;
    },
    async jwt({ token, user, trigger, account }) {
      // On initial sign-in, populate the token with user data
      if (user) {
        // For OAuth sign-ins, the user may be new — ensure DB fields are loaded
        if (account?.provider !== "credentials") {
          const dbUser = await db.user.findUnique({
            where: { id: user.id! },
            select: {
              role: true,
              username: true,
              verificationTier: true,
              onboardingComplete: true,
            },
          });
          if (dbUser) {
            token.id = user.id!;
            token.role = dbUser.role;
            token.username = dbUser.username;
            token.verificationTier = dbUser.verificationTier;
            token.onboardingComplete = dbUser.onboardingComplete;
            token.picture = user.image ?? "";
            token.name = user.name ?? "";
          } else {
            token.id = user.id!;
            token.role = "USER";
            token.username = "";
            token.verificationTier = "UNVERIFIED";
            token.onboardingComplete = false;
          }
        } else {
          token.id = user.id!;
          token.role = (user as any).role ?? "USER";
          token.username = (user as any).username ?? "";
          token.verificationTier = (user as any).verificationTier ?? "UNVERIFIED";
          token.onboardingComplete = (user as any).onboardingComplete ?? false;
          token.picture = user.image ?? "";
          token.name = user.name ?? "";
        }
      }

      // On session update trigger, refresh from DB
      if (trigger === "update" && token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            username: true,
            verificationTier: true,
            onboardingComplete: true,
            avatar: true,
            displayName: true,
          },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.username = dbUser.username;
          token.verificationTier = dbUser.verificationTier;
          token.onboardingComplete = dbUser.onboardingComplete;
          token.picture = dbUser.avatar;
          token.name = dbUser.displayName ?? dbUser.username;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.username = token.username as string;
        session.user.verificationTier = token.verificationTier as any;
        session.user.onboardingComplete = token.onboardingComplete as boolean;
        session.user.image = (token.picture as string) || null;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      await logEvent("LOGIN_SUCCESS", {
        userId: user.id ?? undefined,
        metadata: { provider: account?.provider ?? "unknown" },
      });
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
