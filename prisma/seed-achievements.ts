import { PrismaClient, AchievementCategory } from "@prisma/client";

const prisma = new PrismaClient();

interface AchievementSeed {
  slug: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  tiers: number[];
  xpPerTier: number[];
  sortOrder: number;
}

const achievements: AchievementSeed[] = [
  {
    slug: "builder",
    name: "Builder",
    description: "Upload Gunpla builds to your hangar",
    category: "BUILDING",
    icon: "hammer",
    tiers: [1, 3, 5, 10, 20],
    xpPerTier: [25, 50, 100, 150, 200],
    sortOrder: 1,
  },
  {
    slug: "supporter",
    name: "Supporter",
    description: "Show love by liking other builders' work",
    category: "SOCIAL",
    icon: "heart",
    tiers: [1, 10, 25, 50, 100],
    xpPerTier: [10, 30, 75, 100, 150],
    sortOrder: 2,
  },
  {
    slug: "rising_star",
    name: "Rising Star",
    description: "Earn likes from the community on your builds",
    category: "POPULARITY",
    icon: "star",
    tiers: [5, 10, 25, 50, 100],
    xpPerTier: [25, 50, 100, 150, 200],
    sortOrder: 3,
  },
  {
    slug: "forum_voice",
    name: "Forum Voice",
    description: "Participate in forum discussions",
    category: "FORUM",
    icon: "message-square",
    tiers: [1, 5, 10, 25, 50],
    xpPerTier: [10, 15, 30, 50, 75],
    sortOrder: 4,
  },
  {
    slug: "genealogist",
    name: "Genealogist",
    description: "Create build lineages tracing your evolution",
    category: "LINEAGE",
    icon: "git-branch",
    tiers: [1, 2, 3, 5, 10],
    xpPerTier: [20, 30, 50, 75, 100],
    sortOrder: 5,
  },
  {
    slug: "collector",
    name: "Collector",
    description: "Build your Gunpla kit collection",
    category: "COLLECTOR",
    icon: "package",
    tiers: [1, 5, 10, 25, 50],
    xpPerTier: [10, 25, 50, 75, 150],
    sortOrder: 6,
  },
  {
    slug: "critic",
    name: "Critic",
    description: "Write reviews for Gunpla kits",
    category: "COLLECTOR",
    icon: "book-open",
    tiers: [1, 3, 5, 10, 25],
    xpPerTier: [15, 25, 50, 75, 100],
    sortOrder: 7,
  },
  {
    slug: "community_pillar",
    name: "Community Pillar",
    description: "Establish your presence in the community",
    category: "COMMUNITY",
    icon: "users",
    tiers: [1, 1, 1, 1, 1],
    xpPerTier: [15, 20, 25, 30, 50],
    sortOrder: 8,
  },
];

async function main() {
  console.log("Seeding tiered achievements...\n");

  // Clean slate: delete all user achievement records then all achievements
  const deletedUA = await prisma.userAchievement.deleteMany({});
  console.log(`  Deleted ${deletedUA.count} UserAchievement records`);

  const deletedA = await prisma.achievement.deleteMany({});
  console.log(`  Deleted ${deletedA.count} Achievement records\n`);

  for (const achievement of achievements) {
    const result = await prisma.achievement.upsert({
      where: { slug: achievement.slug },
      create: {
        slug: achievement.slug,
        name: achievement.name,
        description: achievement.description,
        category: achievement.category,
        icon: achievement.icon,
        tiers: achievement.tiers,
        xpPerTier: achievement.xpPerTier,
        sortOrder: achievement.sortOrder,
        // Backward compat: set old fields to tier 1 values
        threshold: achievement.tiers[0],
        xpReward: achievement.xpPerTier[0],
      },
      update: {
        name: achievement.name,
        description: achievement.description,
        category: achievement.category,
        icon: achievement.icon,
        tiers: achievement.tiers,
        xpPerTier: achievement.xpPerTier,
        sortOrder: achievement.sortOrder,
        threshold: achievement.tiers[0],
        xpReward: achievement.xpPerTier[0],
      },
    });
    console.log(
      `  + ${result.slug}: "${result.name}" (${result.category}, tiers: [${achievement.tiers.join(", ")}], xp: [${achievement.xpPerTier.join(", ")}])`
    );
  }

  console.log(`\nSeeded ${achievements.length} tiered achievements!`);
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
