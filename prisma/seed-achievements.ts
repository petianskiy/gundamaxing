import { PrismaClient, AchievementCategory } from "@prisma/client";

const prisma = new PrismaClient();

interface AchievementSeed {
  slug: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  xpReward: number;
  threshold: number;
  sortOrder: number;
}

const achievements: AchievementSeed[] = [
  // ─── BUILDING (Builds uploaded) ───────────────────────────────
  {
    slug: "first_build",
    name: "First Steps",
    description: "Upload your first build",
    category: "BUILDING",
    icon: "hammer",
    xpReward: 25,
    threshold: 1,
    sortOrder: 1,
  },
  {
    slug: "five_builds",
    name: "Hangar Builder",
    description: "Upload 5 builds",
    category: "BUILDING",
    icon: "warehouse",
    xpReward: 50,
    threshold: 5,
    sortOrder: 2,
  },
  {
    slug: "ten_builds",
    name: "Workshop Veteran",
    description: "Upload 10 builds",
    category: "BUILDING",
    icon: "wrench",
    xpReward: 100,
    threshold: 10,
    sortOrder: 3,
  },
  {
    slug: "twenty_builds",
    name: "Master Builder",
    description: "Upload 20 builds",
    category: "BUILDING",
    icon: "trophy",
    xpReward: 200,
    threshold: 20,
    sortOrder: 4,
  },

  // ─── SOCIAL (Likes given) ─────────────────────────────────────
  {
    slug: "first_like",
    name: "Supporter",
    description: "Like your first build",
    category: "SOCIAL",
    icon: "heart",
    xpReward: 10,
    threshold: 1,
    sortOrder: 1,
  },
  {
    slug: "fifty_likes",
    name: "Enthusiast",
    description: "Like 50 builds",
    category: "SOCIAL",
    icon: "heart-handshake",
    xpReward: 75,
    threshold: 50,
    sortOrder: 2,
  },
  {
    slug: "hundred_likes",
    name: "True Fan",
    description: "Like 100 builds",
    category: "SOCIAL",
    icon: "sparkles",
    xpReward: 150,
    threshold: 100,
    sortOrder: 3,
  },

  // ─── POPULARITY (Likes received) ──────────────────────────────
  {
    slug: "ten_likes_received",
    name: "Getting Noticed",
    description: "Receive 10 likes on your builds",
    category: "POPULARITY",
    icon: "star",
    xpReward: 50,
    threshold: 10,
    sortOrder: 1,
  },
  {
    slug: "fifty_likes_received",
    name: "Popular Builder",
    description: "Receive 50 likes on your builds",
    category: "POPULARITY",
    icon: "flame",
    xpReward: 100,
    threshold: 50,
    sortOrder: 2,
  },
  {
    slug: "hundred_likes_received",
    name: "Community Star",
    description: "Receive 100 likes on your builds",
    category: "POPULARITY",
    icon: "crown",
    xpReward: 200,
    threshold: 100,
    sortOrder: 3,
  },

  // ─── FORUM (Forum participation) ──────────────────────────────
  {
    slug: "first_thread",
    name: "Discussion Starter",
    description: "Create your first thread",
    category: "FORUM",
    icon: "message-square-plus",
    xpReward: 15,
    threshold: 1,
    sortOrder: 1,
  },
  {
    slug: "first_comment",
    name: "Contributor",
    description: "Post your first comment",
    category: "FORUM",
    icon: "message-circle",
    xpReward: 10,
    threshold: 1,
    sortOrder: 2,
  },
  {
    slug: "ten_posts",
    name: "Active Voice",
    description: "Post 10 comments or threads",
    category: "FORUM",
    icon: "messages-square",
    xpReward: 30,
    threshold: 10,
    sortOrder: 3,
  },
  {
    slug: "fifty_comments",
    name: "Chatty Builder",
    description: "Post 50 comments or threads",
    category: "FORUM",
    icon: "megaphone",
    xpReward: 75,
    threshold: 50,
    sortOrder: 4,
  },

  // ─── LINEAGE (Build DNA) ──────────────────────────────────────
  {
    slug: "first_lineage",
    name: "Genealogist",
    description: "Create your first lineage",
    category: "LINEAGE",
    icon: "git-branch",
    xpReward: 20,
    threshold: 1,
    sortOrder: 1,
  },
  {
    slug: "five_lineages",
    name: "Lineage Master",
    description: "Create 5 lineages",
    category: "LINEAGE",
    icon: "git-merge",
    xpReward: 75,
    threshold: 5,
    sortOrder: 2,
  },

  // ─── COLLECTOR (Kit collection) ───────────────────────────────
  {
    slug: "first_kit",
    name: "Collector",
    description: "Add your first kit to your collection",
    category: "COLLECTOR",
    icon: "package",
    xpReward: 10,
    threshold: 1,
    sortOrder: 1,
  },
  {
    slug: "ten_kits",
    name: "Hoarder",
    description: "Collect 10 kits",
    category: "COLLECTOR",
    icon: "boxes",
    xpReward: 50,
    threshold: 10,
    sortOrder: 2,
  },
  {
    slug: "twenty_five_kits",
    name: "Armory",
    description: "Collect 25 kits",
    category: "COLLECTOR",
    icon: "shield",
    xpReward: 100,
    threshold: 25,
    sortOrder: 3,
  },
  {
    slug: "fifty_kits",
    name: "Arsenal",
    description: "Collect 50 kits",
    category: "COLLECTOR",
    icon: "swords",
    xpReward: 150,
    threshold: 50,
    sortOrder: 4,
  },
  {
    slug: "first_review",
    name: "Critic",
    description: "Write your first kit review",
    category: "COLLECTOR",
    icon: "book-open",
    xpReward: 15,
    threshold: 1,
    sortOrder: 5,
  },

  // ─── COMMUNITY ────────────────────────────────────────────────
  {
    slug: "profile_complete",
    name: "Identity Established",
    description: "Complete your profile",
    category: "COMMUNITY",
    icon: "user-check",
    xpReward: 20,
    threshold: 1,
    sortOrder: 1,
  },
  {
    slug: "hangar_setup",
    name: "Home Base",
    description: "Customize your hangar",
    category: "COMMUNITY",
    icon: "home",
    xpReward: 15,
    threshold: 1,
    sortOrder: 2,
  },
];

async function main() {
  console.log("Seeding achievements...\n");

  for (const achievement of achievements) {
    const result = await prisma.achievement.upsert({
      where: { slug: achievement.slug },
      create: achievement,
      update: {
        name: achievement.name,
        description: achievement.description,
        category: achievement.category,
        icon: achievement.icon,
        xpReward: achievement.xpReward,
        threshold: achievement.threshold,
        sortOrder: achievement.sortOrder,
      },
    });
    console.log(`  + ${result.slug}: "${result.name}" (${result.category}, threshold: ${result.threshold}, xp: ${result.xpReward})`);
  }

  console.log(`\nSeeded ${achievements.length} achievements!`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
