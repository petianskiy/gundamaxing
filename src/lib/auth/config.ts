import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/security/password";

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

      const email = (credentials.email as string).toLowerCase();
      const password = credentials.password as string;

      const user = await db.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          username: true,
          handle: true,
          displayName: true,
          avatar: true,
          role: true,
          verificationTier: true,
          onboardingComplete: true,
        },
      });

      if (!user || !user.passwordHash) {
        return null;
      }

      const isValid = await verifyPassword(password, user.passwordHash);

      if (!isValid) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.displayName ?? user.username,
        image: user.avatar,
        role: user.role,
        handle: user.handle,
        verificationTier: user.verificationTier,
        onboardingComplete: user.onboardingComplete,
      };
    },
  }),
];

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  );
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  providers.push(
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    })
  );
}

const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(db) as NextAuthConfig["adapter"],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
    error: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On initial sign-in, populate the token with user data
      if (user) {
        token.id = user.id!;
        token.role = (user as any).role ?? "USER";
        token.handle = (user as any).handle ?? "";
        token.verificationTier = (user as any).verificationTier ?? "UNVERIFIED";
        token.onboardingComplete = (user as any).onboardingComplete ?? false;
      }

      // On session update trigger, refresh from DB
      if (trigger === "update" && token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            handle: true,
            verificationTier: true,
            onboardingComplete: true,
            avatar: true,
            displayName: true,
            username: true,
          },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.handle = dbUser.handle;
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
        session.user.handle = token.handle as string;
        session.user.verificationTier = token.verificationTier as any;
        session.user.onboardingComplete = token.onboardingComplete as boolean;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
