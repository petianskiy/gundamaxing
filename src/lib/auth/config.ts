import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/security/password";
import { logEvent } from "@/lib/data/events";
import { toCdnUrl } from "@/lib/upload/cdn";

// ---------------------------------------------------------------------------
// Custom adapter: wraps PrismaAdapter to handle OAuth user creation
// ---------------------------------------------------------------------------

// Retry helper for Neon serverless cold starts and transient DB errors
async function withRetry<T>(fn: () => Promise<T>, label: string, retries = 2): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt < retries) {
        const delay = 250 * (attempt + 1);
        console.warn(`[auth] ${label} failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms:`, (err as Error).message);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
  throw new Error("unreachable");
}

function createAdapter() {
  const base = PrismaAdapter(db);

  const USER_SELECT = {
    id: true,
    displayName: true,
    email: true,
    emailVerified: true,
    avatar: true,
    role: true,
    username: true,
    verificationTier: true,
    onboardingComplete: true,
  } as const;

  function toAdapterUser(u: {
    id: string;
    displayName: string | null;
    email: string;
    emailVerified: Date | null;
    avatar: string | null;
    role: string;
    username: string;
    verificationTier: string;
    onboardingComplete: boolean;
  }) {
    return {
      id: u.id,
      name: u.displayName,
      email: u.email,
      emailVerified: u.emailVerified,
      image: u.avatar,
      role: u.role,
      username: u.username,
      verificationTier: u.verificationTier,
      onboardingComplete: u.onboardingComplete,
    };
  }

  return {
    ...base,

    // Override all user-returning methods so auth.js always gets correct
    // field names (name/image instead of displayName/avatar) and DB queries
    // are retried on transient Neon cold-start failures.
    async getUser(id: string) {
      return withRetry(async () => {
        const user = await db.user.findUnique({ where: { id }, select: USER_SELECT });
        return user ? toAdapterUser(user) : null;
      }, "getUser");
    },
    async getUserByEmail(email: string) {
      return withRetry(async () => {
        const user = await db.user.findUnique({ where: { email }, select: USER_SELECT });
        return user ? toAdapterUser(user) : null;
      }, "getUserByEmail");
    },
    async getUserByAccount({ provider, providerAccountId }: { provider: string; providerAccountId: string }) {
      return withRetry(async () => {
        const account = await db.account.findUnique({
          where: { provider_providerAccountId: { provider, providerAccountId } },
          select: { user: { select: USER_SELECT } },
        });
        return account?.user ? toAdapterUser(account.user) : null;
      }, "getUserByAccount");
    },

    async createUser(data: { name?: string | null; email: string; emailVerified?: Date | null; image?: string | null }) {
      // For Discord users without verified email, generate a unique placeholder
      // to avoid unique constraint violations on the email column
      const email = data.email || `discord_noemail_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@placeholder.invalid`;

      // Generate a username from the email prefix
      const prefix = email
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9_.]/g, "")
        .replace(/\.{2,}/g, ".")
        .replace(/\.$/, "")
        .slice(0, 25) || "user";

      // Retry loop: avoids TOCTOU race by directly attempting create
      // and retrying with a new suffix on username collision
      const MAX_ATTEMPTS = 5;
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const username = attempt === 0
          ? prefix
          : `${prefix}_${Math.floor(1000 + Math.random() * 9000)}`;

        try {
          // OAuth users are inherently verified — they authenticated via a trusted provider
          const user = await db.user.create({
            data: {
              displayName: data.name ?? null,
              email,
              emailVerified: new Date(),
              avatar: data.image ?? null,
              username,
              verificationTier: "VERIFIED",
              onboardingComplete: true,
              onboardingStep: 4,
            },
          });

          console.log(`[auth] created_new_user: id=${user.id}, username=${username}, email=${email.includes("@placeholder.invalid") ? "placeholder" : "provider"}, tier=VERIFIED`);

          // Auto-promote designated admin users on first registration
          const adminUsernames = (process.env.ADMIN_USERNAMES || "petianskiy").split(",").map(s => s.trim());
          if (adminUsernames.includes(username)) {
            await db.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
            user.role = "ADMIN" as any;
            console.log(`[auth] auto-promoted ${username} to ADMIN`);
          }

          return toAdapterUser(user);
        } catch (err: any) {
          if (err?.code === "P2002") {
            // Prisma reports constraint target as array or string depending on version
            const rawTarget = err?.meta?.target;
            const targetStr = Array.isArray(rawTarget) ? rawTarget.join(",") : String(rawTarget ?? "");

            // Email collision → user already exists from a previous partial OAuth attempt.
            // Find by email ONLY to avoid matching the wrong user by username.
            if (targetStr.includes("email")) {
              const existingUser = await db.user.findUnique({
                where: { email },
                select: USER_SELECT,
              });
              if (existingUser) {
                console.log(`[auth] user_already_exists: reusing id=${existingUser.id}, username=${existingUser.username}`);
                return toAdapterUser(existingUser);
              }
            }

            // Username collision → retry with a different suffix
            if (targetStr.includes("username")) {
              console.log(`[auth] username_collision: ${username}, retrying (attempt ${attempt + 1}/${MAX_ATTEMPTS})`);
              continue;
            }

            // Unknown P2002 target — try email lookup as fallback
            const existingUser = await db.user.findUnique({
              where: { email },
              select: USER_SELECT,
            });
            if (existingUser) {
              console.log(`[auth] user_already_exists (fallback): reusing id=${existingUser.id}`);
              return toAdapterUser(existingUser);
            }
          }
          console.error("[auth] createUser failed:", err);
          throw err;
        }
      }

      // Exhausted retries — use a timestamp + random suffix as last resort
      const fallbackUsername = `${prefix}_${Date.now().toString(36).slice(-4)}${Math.random().toString(36).slice(2, 5)}`;
      const user = await db.user.create({
        data: {
          displayName: data.name ?? null,
          email,
          emailVerified: new Date(),
          avatar: data.image ?? null,
          username: fallbackUsername,
          verificationTier: "VERIFIED",
          onboardingComplete: true,
          onboardingStep: 4,
        },
      });
      console.log(`[auth] created_new_user (fallback): id=${user.id}, username=${fallbackUsername}`);
      return toAdapterUser(user);
    },
    async linkAccount(account: any) {
      return withRetry(async () => {
        try {
          const result = await base.linkAccount!(account);
          console.log(`[auth] linked_account: provider=${account.provider}, userId=${account.userId}`);
          return result;
        } catch (err: any) {
          // If this provider account is already linked (from a previous partial attempt),
          // treat it as success rather than failing the entire sign-in flow
          if (err?.code === "P2002") {
            console.log(`[auth] account_already_linked: provider=${account.provider}, userId=${account.userId}`);
            return;
          }
          throw err;
        }
      }, `linkAccount(${account.provider})`);
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
    error: "/login",
  },
  trustHost: true,
  providers,
  logger: {
    error(error) {
      // Log actual error details to Vercel function logs for debugging OAuth issues
      console.error("[auth] AUTH_ERROR:", error.name, error.message, error.cause ? `cause=${JSON.stringify(error.cause)}` : "");
    },
    warn(code) {
      console.warn("[auth] AUTH_WARN:", code);
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (user.id) {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: user.id },
            select: { riskScore: true, emailVerified: true, banReason: true },
          });

          // Block banned users (riskScore >= 100) — redirect with reason
          if (dbUser && dbUser.riskScore >= 100) {
            const reason = encodeURIComponent(dbUser.banReason || "Your account has been suspended.");
            return `/login?error=AccountBanned&reason=${reason}`;
          }

          // Block unverified credential logins (OAuth users are not affected)
          if (
            account?.provider === "credentials" &&
            dbUser &&
            !dbUser.emailVerified
          ) {
            return "/login?error=EmailNotVerified";
          }
        } catch (err) {
          console.error("[auth] signIn callback DB error:", err);
          // Allow sign-in to proceed even if DB check fails — the user is already authenticated
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
      return `${baseUrl}/auth-redirect`;
    },
    async jwt({ token, user, trigger, account }) {
      // On initial sign-in, populate the token with user data
      if (user) {
        // For OAuth sign-ins, the user may be new — ensure DB fields are loaded
        if (account?.provider !== "credentials") {
          try {
            let dbUser = await db.user.findUnique({
              where: { id: user.id! },
              select: {
                role: true,
                username: true,
                verificationTier: true,
                onboardingComplete: true,
                avatar: true,
                riskScore: true,
              },
            });

            // If user was just created by the adapter, the read might be stale.
            // Retry once after a short delay.
            if (!dbUser) {
              await new Promise(r => setTimeout(r, 250));
              dbUser = await db.user.findUnique({
                where: { id: user.id! },
                select: {
                  role: true,
                  username: true,
                  verificationTier: true,
                  onboardingComplete: true,
                  avatar: true,
                  riskScore: true,
                },
              });
            }

            if (dbUser) {
              // Auto-promote designated admin users on login
              const adminUsernames = (process.env.ADMIN_USERNAMES || "petianskiy").split(",").map(s => s.trim());
              if (dbUser.username && adminUsernames.includes(dbUser.username) && dbUser.role !== "ADMIN") {
                await db.user.update({ where: { id: user.id! }, data: { role: "ADMIN" } });
                dbUser.role = "ADMIN" as any;
                console.log(`[auth] auto-promoted ${dbUser.username} to ADMIN on login`);
              }

              token.id = user.id!;
              token.role = dbUser.role;
              token.username = dbUser.username;
              token.verificationTier = dbUser.verificationTier;
              token.onboardingComplete = dbUser.onboardingComplete;
              token.picture = dbUser.avatar ? toCdnUrl(dbUser.avatar) : user.image ?? "";
              token.name = user.name ?? "";
              token.isBanned = dbUser.riskScore >= 100;
            } else {
              // User not found even after retry — use adapter-returned data
              console.error(`[auth] jwt: user ${user.id} not found in DB after retry`);
              token.id = user.id!;
              token.role = (user as any).role ?? "USER";
              token.username = (user as any).username ?? "";
              token.verificationTier = (user as any).verificationTier ?? "VERIFIED";
              token.onboardingComplete = (user as any).onboardingComplete ?? true;
              token.picture = user.image ?? "";
              token.name = user.name ?? "";
              token.isBanned = false;
            }
          } catch (err) {
            console.error("[auth] jwt callback DB error:", err);
            // Fallback: use adapter-returned user data (includes fields set by createUser)
            token.id = user.id!;
            token.role = (user as any).role ?? "USER";
            token.username = (user as any).username ?? "";
            token.verificationTier = (user as any).verificationTier ?? "VERIFIED";
            token.onboardingComplete = (user as any).onboardingComplete ?? true;
            token.picture = user.image ?? "";
            token.name = user.name ?? "";
            token.isBanned = false;
          }
        } else {
          // Credentials login — always read fresh from DB to catch username changes
          const freshDbUser = await db.user.findUnique({
            where: { id: user.id! },
            select: { role: true, username: true, displayName: true, verificationTier: true, onboardingComplete: true, avatar: true, riskScore: true },
          });
          if (freshDbUser) {
            token.id = user.id!;
            token.role = freshDbUser.role;
            token.username = freshDbUser.username;
            token.verificationTier = freshDbUser.verificationTier;
            token.onboardingComplete = freshDbUser.onboardingComplete;
            token.picture = freshDbUser.avatar ? toCdnUrl(freshDbUser.avatar) : user.image ?? "";
            token.name = freshDbUser.displayName ?? freshDbUser.username;
            token.isBanned = freshDbUser.riskScore >= 100;
          } else {
            token.id = user.id!;
            token.role = (user as any).role ?? "USER";
            token.username = (user as any).username ?? "";
            token.verificationTier = (user as any).verificationTier ?? "UNVERIFIED";
            token.onboardingComplete = (user as any).onboardingComplete ?? false;
            token.picture = user.image ?? "";
            token.name = user.name ?? "";
            token.isBanned = false;
          }
        }
      }

      // Periodic refresh (every 5 minutes) to catch admin-side changes + username changes + avatar updates + bans
      if (!user && trigger !== "update" && token.id) {
        const lastCheck = (token.lastRoleCheck as number) || 0;
        if (Date.now() - lastCheck > 5 * 60 * 1000) {
          const freshUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, username: true, displayName: true, avatar: true, riskScore: true },
          });
          if (freshUser) {
            token.role = freshUser.role;
            token.username = freshUser.username;
            token.name = freshUser.displayName ?? freshUser.username;
            token.picture = freshUser.avatar ? toCdnUrl(freshUser.avatar) : token.picture ?? "";
            token.isBanned = freshUser.riskScore >= 100;
          }
          token.lastRoleCheck = Date.now();
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
            riskScore: true,
          },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.username = dbUser.username;
          token.verificationTier = dbUser.verificationTier;
          token.onboardingComplete = dbUser.onboardingComplete;
          token.picture = dbUser.avatar ? toCdnUrl(dbUser.avatar) : "";
          token.name = dbUser.displayName ?? dbUser.username;
          token.isBanned = dbUser.riskScore >= 100;
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
        session.user.isBanned = (token.isBanned as boolean) || false;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      try {
        await logEvent("LOGIN_SUCCESS", {
          userId: user.id ?? undefined,
          metadata: { provider: account?.provider ?? "unknown" },
        });
      } catch (err) {
        console.error("[auth] Failed to log sign-in event:", err);
      }
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
