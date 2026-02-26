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
  id?: string;
  url: string;
  alt: string;
  isPrimary?: boolean;
  objectPosition?: string;
  order?: number;
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
  slug: string;
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
  userHandle: string;
  userAvatar: string;
  likes: number;
  comments: number;
  forkCount: number;
  bookmarks: number;
  respectCount: number;
  techniqueCount: number;
  creativityCount: number;
  userReactions?: string[];
  verification: VerificationTier;
  commentsEnabled: boolean;
  showcaseLayout?: ShowcaseLayout | null;
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

export interface GifAttachment {
  url: string;
  previewUrl: string | null;
  width: number;
  height: number;
  slug: string | null;
}

export interface Thread {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  categoryName: string;
  userId: string;
  username: string;
  userHandle: string;
  userAvatar: string;
  replies: number;
  views: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  lastReplyAt: string;
  gif: GifAttachment | null;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  username: string;
  userHandle: string;
  userAvatar: string;
  likes: number;
  createdAt: string;
  children?: Comment[];
  gif: GifAttachment | null;
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

export type ReactionType = "RESPECT" | "TECHNIQUE" | "CREATIVITY";
export type HangarTheme = "CLEAN_LAB" | "CYBER_BAY" | "DESERT_BATTLEFIELD" | "NEON_TOKYO";
export type HangarLayout = "GALLERY" | "BLUEPRINT" | "STORY";

export interface BuildEra {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  order: number;
  isCollapsed: boolean;
  builds: Build[];
}

export interface HangarUser {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  banner: string | null;
  bio: string | null;
  accentColor: string | null;
  verificationTier: string;
  level: number;
  reputation: number;
  hangarTheme: HangarTheme;
  hangarLayout: HangarLayout;
  manifesto: string | null;
  socialLinks: Record<string, string>;
  isProfilePrivate: boolean;
  skillLevel: string | null;
  preferredGrades: string[];
  tools: string[];
  techniques: string[];
  country: string | null;
  createdAt: string;
  buildCount: number;
  badgeCount: number;
}

// ─── Showcase Canvas ─────────────────────────────────────────────

export interface ShowcasePageBackground {
  imageUrl?: string | null;
  color?: string | null;
  opacity?: number;
  blur?: number;
  overlayOpacity?: number;
  config?: Record<string, unknown> | null;
}

export interface ShowcasePage {
  id: string;
  elements: ShowcaseElement[];
  background?: ShowcasePageBackground;
}

export interface ShowcaseLayout {
  version: 1;
  canvas: {
    backgroundImageUrl: string | null;
    backgroundColor: string | null;
    backgroundOpacity: number;
    backgroundBlur: number;
    aspectRatio: string;
    backgroundConfig?: Record<string, unknown> | null;
    overlayOpacity?: number;
  };
  elements: ShowcaseElement[];
  pages?: ShowcasePage[];
}

export type ShowcaseElement =
  | ShowcaseImageElement
  | ShowcaseTextElement
  | ShowcaseMetadataElement
  | ShowcaseEffectElement
  | ShowcaseVideoElement
  | ShowcaseShapeElement;

export interface ShowcaseElementBase {
  id: string;
  type: "image" | "text" | "metadata" | "effect" | "video" | "shape";
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  rotation: number;
}

export interface ShowcaseImageElement extends ShowcaseElementBase {
  type: "image";
  imageId: string;
  imageUrl: string;
  objectFit: "cover" | "contain";
  borderRadius: number;
  shadow: boolean;
  caption: string | null;
  flipH?: boolean;
  flipV?: boolean;
}

export type ShowcaseFontFamily = "geist" | "orbitron" | "rajdhani" | "exo2" | "shareTechMono" | "audiowide" | "chakraPetch";

export interface ShowcaseTextElement extends ShowcaseElementBase {
  type: "text";
  content: string;
  fontSize: number;
  fontFamily: ShowcaseFontFamily;
  color: string;
  textAlign: "left" | "center" | "right";
  backgroundColor: string | null;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  gradient: boolean;
  gradientColors: string[];
  gradientSpeed: number;
  fuzzy: boolean;
  fuzzyIntensity: number;
  fuzzyHoverIntensity: number;
  fuzzyFuzzRange: number;
  fuzzyDirection: "horizontal" | "vertical" | "both";
  fuzzyTransitionDuration: number;
  fuzzyLetterSpacing: number;
  fuzzyEnableHover: boolean;
  fuzzyClickEffect: boolean;
  fuzzyGlitchMode: boolean;
  fuzzyGlitchInterval: number;
  fuzzyGlitchDuration: number;
}

export interface ShowcaseMetadataElement extends ShowcaseElementBase {
  type: "metadata";
  variant: "compact" | "full";
}

export interface ShowcaseEffectElement extends ShowcaseElementBase {
  type: "effect";
  effectType: "electric";
  color: string;
  speed: number;
  chaos: number;
  borderRadius: number;
}

export interface ShowcaseVideoElement extends ShowcaseElementBase {
  type: "video";
  url: string;
  objectFit: "cover" | "contain";
  muted: boolean;
  loop: boolean;
  borderRadius: number;
}

// ─── Shape Element ──────────────────────────────────────────────

export type ShapeType = "rectangle" | "circle" | "triangle" | "star" | "hexagon" | "arrow" | "diamond" | "pentagon";

export type ShapeFill =
  | { type: "solid"; color: string }
  | { type: "gradient"; colors: string[]; angle: number }
  | { type: "image"; imageUrl: string; objectFit: "cover" | "contain" }
  | { type: "none" };

export interface ShowcaseShapeElement extends ShowcaseElementBase {
  type: "shape";
  shapeType: ShapeType;
  fill: ShapeFill;
  stroke: string | null;
  strokeWidth: number;
  opacity: number;
  cornerRadius: number;
  shadow: boolean;
}

// ─── Lineages (Build DNA) ────────────────────────────────────────

export interface LineageNodeUI {
  id: string;
  buildId: string;
  build: Pick<Build, "id" | "slug" | "title" | "kitName" | "grade" | "scale" | "images" | "status">;
  parentId: string | null;
  annotation: string | null;
  order: number;
  children: LineageNodeUI[];
}

export interface LineageSummary {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  userId: string;
  username: string;
  userHandle: string;
  userAvatar: string;
  isPublic: boolean;
  nodeCount: number;
  previewBuilds: Pick<Build, "id" | "title" | "images">[];
  createdAt: string;
  updatedAt: string;
}

export interface LineageDetail extends Omit<LineageSummary, "previewBuilds" | "nodeCount"> {
  nodes: LineageNodeUI[];
}

// ─── Hangar ─────────────────────────────────────────────────────

export interface HangarData {
  user: HangarUser;
  featuredBuild: Build | null;
  latestBuilds: Build[];
  eras: BuildEra[];
  unassignedBuilds: Build[];
}

// ─── Collector's Lore ────────────────────────────────────────
export type KitStatus = "OWNED" | "BUILT" | "WISHLIST" | "BACKLOG";

export interface GunplaKitUI {
  id: string;
  name: string;
  seriesName: string;
  grade: string;
  scale: string | null;
  releaseYear: number | null;
  manufacturer: string;
  imageUrl: string | null;
  slug: string;
  totalOwners: number;
  avgRating: number | null;
}

export interface UserKitUI {
  id: string;
  kitId: string;
  kit: GunplaKitUI;
  status: KitStatus;
  buildDifficulty: number | null;
  partQuality: number | null;
  overallRating: number | null;
  review: string | null;
  createdAt: string;
}

export interface UserKitReviewUI {
  id: string;
  userId: string;
  username: string;
  userAvatar: string | null;
  status: KitStatus;
  buildDifficulty: number | null;
  partQuality: number | null;
  overallRating: number | null;
  review: string | null;
  createdAt: string;
}

// ─── Achievements & Levels ──────────────────────────────────
export type AchievementCategory = "BUILDING" | "SOCIAL" | "POPULARITY" | "LINEAGE" | "FORUM" | "COLLECTOR" | "COMMUNITY";

export interface AchievementUI {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string | null;
  tiers: number[];
  xpPerTier: number[];
}

export interface UserAchievementUI {
  achievement: AchievementUI;
  tier: number;
  progress: number;
  nextTierThreshold: number | null;
}

export interface LevelInfo {
  level: number;
  xp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number; // 0-100 percentage
}
