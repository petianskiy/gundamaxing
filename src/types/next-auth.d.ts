import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "MODERATOR" | "ADMIN";
      username: string;
      verificationTier: "UNVERIFIED" | "VERIFIED" | "FEATURED" | "MASTER";
      onboardingComplete: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: "USER" | "MODERATOR" | "ADMIN";
    username: string;
    verificationTier: "UNVERIFIED" | "VERIFIED" | "FEATURED" | "MASTER";
    onboardingComplete: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: "USER" | "MODERATOR" | "ADMIN";
    username: string;
    verificationTier: "UNVERIFIED" | "VERIFIED" | "FEATURED" | "MASTER";
    onboardingComplete: boolean;
  }
}
