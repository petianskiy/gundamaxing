export type Grade = "HG" | "RG" | "MG" | "PG" | "SD" | "RE/100" | "FM" | "EG" | "MGEX" | "HiRM";

export type Timeline =
  | "Universal Century"
  | "Future Century"
  | "After Colony"
  | "After War"
  | "Correct Century"
  | "Cosmic Era"
  | "Anno Domini"
  | "Advanced Generation"
  | "Regild Century"
  | "Post Disaster"
  | "Ad Stella"
  | "Build Series";

export type Scale = "1/144" | "1/100" | "1/60" | "Non-scale";

export type Technique =
  | "Straight Build"
  | "Panel Lining"
  | "Painting"
  | "Airbrushing"
  | "Hand Painting"
  | "Weathering"
  | "Scribing"
  | "Pla-plating"
  | "Kitbashing"
  | "Scratch Building"
  | "LED/Electronics"
  | "Custom Decals"
  | "Topcoat"
  | "Candy Coat"
  | "Metallic Finish"
  | "Battle Damage";

export type VerificationTier = "unverified" | "verified" | "featured" | "master";

export type BuildStatus = "WIP" | "Completed" | "Abandoned";

export interface BuildImage {
  url: string;
  alt: string;
  isPrimary?: boolean;
  objectPosition?: string;
}

export interface BuildLogEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  images: string[];
}

export interface CalloutPin {
  id: string;
  x: number; // percentage
  y: number; // percentage
  label: string;
  description: string;
}

export interface Build {
  id: string;
  title: string;
  kitName: string;
  grade: Grade;
  timeline: Timeline;
  scale: Scale;
  status: BuildStatus;
  techniques: Technique[];
  paintSystem?: string;
  topcoat?: string;
  timeInvested?: string;
  tools?: string[];
  intentStatement?: string;
  images: BuildImage[];
  calloutPins?: CalloutPin[];
  buildLog?: BuildLogEntry[];
  baseKit?: string;
  inspiredBy?: string[];
  forks?: string[];
  userId: string;
  username: string;
  userAvatar: string;
  likes: number;
  comments: number;
  forkCount: number;
  bookmarks: number;
  verification: VerificationTier;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  level: number;
  reputation: number;
  verificationTier: VerificationTier;
  buildCount: number;
  totalLikes: number;
  joinedAt: string;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
}

export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  threadCount: number;
  postCount: number;
  lastActivity: string;
  color: string;
}

export interface Thread {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  categoryName: string;
  userId: string;
  username: string;
  userAvatar: string;
  replies: number;
  views: number;
  isPinned: boolean;
  createdAt: string;
  lastReplyAt: string;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  username: string;
  userAvatar: string;
  likes: number;
  createdAt: string;
  children?: Comment[];
}

export interface Workshop {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  buildCount: number;
  image: string;
}

export type FilterConfig = {
  grades: Grade[];
  timelines: Timeline[];
  scales: Scale[];
  techniques: Technique[];
  verificationTiers: VerificationTier[];
  statuses: BuildStatus[];
};
