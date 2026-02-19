import { PrismaClient, VerificationTier, BuildStatus, BadgeTier, SkillLevel } from "@prisma/client";
import { hash } from "bcryptjs";
import {
  mockUsers,
  mockBuilds,
  mockCategories,
  mockThreads,
  mockComments,
} from "../src/lib/mock/data";

const prisma = new PrismaClient();

// ─── ID Mapping ───────────────────────────────────────────────────
// We need deterministic CUIDs so foreign keys resolve correctly.
// Strategy: create records in order, store the generated IDs in maps.

const userIdMap = new Map<string, string>();
const buildIdMap = new Map<string, string>();
const categoryIdMap = new Map<string, string>();
const threadIdMap = new Map<string, string>();
const badgeIdMap = new Map<string, string>();

// ─── Helpers ──────────────────────────────────────────────────────

function mapVerificationTier(tier: string): VerificationTier {
  const mapping: Record<string, VerificationTier> = {
    unverified: "UNVERIFIED",
    verified: "VERIFIED",
    featured: "FEATURED",
    master: "MASTER",
  };
  return mapping[tier.toLowerCase()] ?? "UNVERIFIED";
}

function mapBuildStatus(status: string): BuildStatus {
  const mapping: Record<string, BuildStatus> = {
    WIP: "WIP",
    Completed: "COMPLETED",
    Abandoned: "ABANDONED",
  };
  return mapping[status] ?? "WIP";
}

function mapBadgeTier(tier: string): BadgeTier {
  const mapping: Record<string, BadgeTier> = {
    bronze: "BRONZE",
    silver: "SILVER",
    gold: "GOLD",
    platinum: "PLATINUM",
  };
  return mapping[tier.toLowerCase()] ?? "BRONZE";
}

// Some builds reference users not in mockUsers (u5..u8). We create them too.
const extraUsers: Array<{
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  level: number;
  reputation: number;
  verificationTier: string;
}> = [
  {
    id: "u5",
    username: "YanaSiluyu",
    displayName: "YanaSiluyu",
    avatar: "https://picsum.photos/seed/avatar5/200/200",
    bio: "Gunpla builder from the east coast.",
    level: 18,
    reputation: 2100,
    verificationTier: "verified",
  },
  {
    id: "u6",
    username: "boi67fromthailand",
    displayName: "boi67fromthailand",
    avatar: "https://picsum.photos/seed/avatar6/200/200",
    bio: "Chrome finishes and candy coats are my jam.",
    level: 22,
    reputation: 2800,
    verificationTier: "verified",
  },
  {
    id: "u7",
    username: "KingVon",
    displayName: "KingVon",
    avatar: "https://picsum.photos/seed/avatar7/200/200",
    bio: "Weathering specialist. Desert theater kits.",
    level: 12,
    reputation: 1200,
    verificationTier: "verified",
  },
  {
    id: "u8",
    username: "VolgogradGudini",
    displayName: "VolgogradGudini",
    avatar: "https://picsum.photos/seed/avatar8/200/200",
    bio: "LED everything. Permet Score 8 or bust.",
    level: 15,
    reputation: 1600,
    verificationTier: "unverified",
  },
];

// ─── Main Seed ────────────────────────────────────────────────────

async function main() {
  console.log("Seeding database...\n");

  // Clean existing data in reverse-dependency order
  console.log("Cleaning existing data...");
  await prisma.userBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.like.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.forumCategory.deleteMany();
  await prisma.buildLogEntry.deleteMany();
  await prisma.calloutPin.deleteMany();
  await prisma.buildImage.deleteMany();
  await prisma.build.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // ── 1. Create Users ──────────────────────────────────────────────
  console.log("Creating users...");
  const defaultPassword = await hash("password123", 12);

  // Create users from mockUsers
  for (const mockUser of mockUsers) {
    const user = await prisma.user.create({
      data: {
        email: `${mockUser.username.toLowerCase()}@gundamaxing.dev`,
        emailVerified: new Date(),
        passwordHash: defaultPassword,
        username: mockUser.username,
        displayName: mockUser.displayName,
        avatar: mockUser.avatar,
        bio: mockUser.bio,
        level: mockUser.level,
        reputation: mockUser.reputation,
        verificationTier: mapVerificationTier(mockUser.verificationTier),
        onboardingComplete: true,
        onboardingStep: 4,
        createdAt: new Date(mockUser.joinedAt),
      },
    });
    userIdMap.set(mockUser.id, user.id);
    console.log(`  + User: ${user.username} (${mockUser.id} -> ${user.id})`);
  }

  // Create extra users referenced by builds but not in mockUsers
  for (const extra of extraUsers) {
    const user = await prisma.user.create({
      data: {
        email: `${extra.username.toLowerCase()}@gundamaxing.dev`,
        emailVerified: new Date(),
        passwordHash: defaultPassword,
        username: extra.username,
        displayName: extra.displayName,
        avatar: extra.avatar,
        bio: extra.bio,
        level: extra.level,
        reputation: extra.reputation,
        verificationTier: mapVerificationTier(extra.verificationTier),
        onboardingComplete: true,
        onboardingStep: 4,
      },
    });
    userIdMap.set(extra.id, user.id);
    console.log(`  + User (extra): ${user.username} (${extra.id} -> ${user.id})`);
  }

  // ── 2. Create Badges & Assign ────────────────────────────────────
  console.log("\nCreating badges...");

  // Collect all unique badges from all mockUsers
  const allBadges = new Map<string, { name: string; icon: string; description: string; tier: string }>();
  for (const mockUser of mockUsers) {
    for (const badge of mockUser.badges) {
      if (!allBadges.has(badge.name)) {
        allBadges.set(badge.name, badge);
      }
    }
  }

  // Create badge records
  for (const [name, badgeData] of allBadges) {
    const badge = await prisma.badge.create({
      data: {
        name: badgeData.name,
        icon: badgeData.icon,
        description: badgeData.description,
        tier: mapBadgeTier(badgeData.tier),
      },
    });
    // Map by name for assignment lookup
    badgeIdMap.set(name, badge.id);
    console.log(`  + Badge: ${badge.name} (${badgeData.tier})`);
  }

  // Assign badges to users
  console.log("\nAssigning badges to users...");
  for (const mockUser of mockUsers) {
    const userId = userIdMap.get(mockUser.id)!;
    for (const badge of mockUser.badges) {
      const badgeId = badgeIdMap.get(badge.name)!;
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId,
        },
      });
      console.log(`  + ${mockUser.username} <- ${badge.name}`);
    }
  }

  // ── 3. Create Builds ─────────────────────────────────────────────
  console.log("\nCreating builds...");

  for (const mockBuild of mockBuilds) {
    const userId = userIdMap.get(mockBuild.userId)!;

    // Generate slug from title
    const baseSlug = mockBuild.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);
    let slug = baseSlug;
    let suffix = 2;
    while (await prisma.build.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    const build = await prisma.build.create({
      data: {
        slug,
        title: mockBuild.title,
        kitName: mockBuild.kitName,
        grade: mockBuild.grade,
        timeline: mockBuild.timeline,
        scale: mockBuild.scale,
        status: mapBuildStatus(mockBuild.status),
        techniques: mockBuild.techniques,
        paintSystem: mockBuild.paintSystem ?? null,
        topcoat: mockBuild.topcoat ?? null,
        timeInvested: mockBuild.timeInvested ?? null,
        tools: mockBuild.tools ?? [],
        intentStatement: mockBuild.intentStatement ?? null,
        baseKit: mockBuild.baseKit ?? null,
        verification: mapVerificationTier(mockBuild.verification),
        inspiredByIds: mockBuild.inspiredBy ?? [],
        userId,
        likeCount: mockBuild.likes,
        commentCount: mockBuild.comments,
        forkCount: mockBuild.forkCount,
        bookmarkCount: mockBuild.bookmarks,
        createdAt: new Date(mockBuild.createdAt),
        updatedAt: new Date(mockBuild.updatedAt),
      },
    });
    buildIdMap.set(mockBuild.id, build.id);
    console.log(`  + Build: "${build.title}" (${mockBuild.id} -> ${build.id})`);

    // Create build images
    if (mockBuild.images && mockBuild.images.length > 0) {
      for (let i = 0; i < mockBuild.images.length; i++) {
        const img = mockBuild.images[i];
        await prisma.buildImage.create({
          data: {
            url: img.url,
            alt: img.alt,
            isPrimary: img.isPrimary ?? false,
            objectPosition: img.objectPosition ?? null,
            order: i,
            buildId: build.id,
          },
        });
      }
      console.log(`    + ${mockBuild.images.length} image(s)`);
    }

    // Create callout pins
    if (mockBuild.calloutPins && mockBuild.calloutPins.length > 0) {
      for (const pin of mockBuild.calloutPins) {
        await prisma.calloutPin.create({
          data: {
            x: pin.x,
            y: pin.y,
            label: pin.label,
            description: pin.description,
            buildId: build.id,
          },
        });
      }
      console.log(`    + ${mockBuild.calloutPins.length} callout pin(s)`);
    }

    // Create build log entries
    if (mockBuild.buildLog && mockBuild.buildLog.length > 0) {
      for (const entry of mockBuild.buildLog) {
        await prisma.buildLogEntry.create({
          data: {
            date: new Date(entry.date),
            title: entry.title,
            content: entry.content,
            images: entry.images,
            buildId: build.id,
            userId,
          },
        });
      }
      console.log(`    + ${mockBuild.buildLog.length} build log entry/entries`);
    }
  }

  // ── 4. Wire up build forks (second pass) ──────────────────────────
  console.log("\nWiring up build fork relationships...");
  for (const mockBuild of mockBuilds) {
    if (mockBuild.forks && mockBuild.forks.length > 0) {
      const parentId = buildIdMap.get(mockBuild.id)!;
      for (const forkMockId of mockBuild.forks) {
        const forkId = buildIdMap.get(forkMockId);
        if (forkId) {
          await prisma.build.update({
            where: { id: forkId },
            data: { forkOfId: parentId },
          });
          console.log(`  + "${forkMockId}" is fork of "${mockBuild.id}"`);
        }
      }
    }
  }

  // ── 5. Create Forum Categories ────────────────────────────────────
  console.log("\nCreating forum categories...");

  for (let i = 0; i < mockCategories.length; i++) {
    const mockCat = mockCategories[i];
    const category = await prisma.forumCategory.create({
      data: {
        name: mockCat.name,
        description: mockCat.description,
        icon: mockCat.icon,
        color: mockCat.color,
        order: i,
        threadCount: mockCat.threadCount,
        postCount: mockCat.postCount,
      },
    });
    categoryIdMap.set(mockCat.id, category.id);
    console.log(`  + Category: ${category.name} (${mockCat.id} -> ${category.id})`);
  }

  // ── 6. Create Threads ─────────────────────────────────────────────
  console.log("\nCreating threads...");

  for (const mockThread of mockThreads) {
    const userId = userIdMap.get(mockThread.userId)!;
    const categoryId = categoryIdMap.get(mockThread.categoryId)!;

    const thread = await prisma.thread.create({
      data: {
        title: mockThread.title,
        content: mockThread.content,
        isPinned: mockThread.isPinned,
        views: mockThread.views,
        replyCount: mockThread.replies,
        categoryId,
        userId,
        lastReplyAt: mockThread.lastReplyAt ? new Date(mockThread.lastReplyAt) : null,
        createdAt: new Date(mockThread.createdAt),
      },
    });
    threadIdMap.set(mockThread.id, thread.id);
    console.log(`  + Thread: "${thread.title}" (${mockThread.id} -> ${thread.id})`);
  }

  // ── 7. Create Comments ────────────────────────────────────────────
  console.log("\nCreating comments...");

  // Comments in mock data are associated with build-001 (the first build)
  const firstBuildId = buildIdMap.get("build-001")!;

  for (const mockComment of mockComments) {
    const userId = userIdMap.get(mockComment.userId)!;

    const comment = await prisma.comment.create({
      data: {
        content: mockComment.content,
        userId,
        buildId: firstBuildId,
        likeCount: mockComment.likes,
        createdAt: new Date(mockComment.createdAt),
      },
    });
    console.log(`  + Comment by ${mockComment.username}: "${mockComment.content.substring(0, 50)}..."`);

    // Create child comments (replies)
    if (mockComment.children && mockComment.children.length > 0) {
      for (const child of mockComment.children) {
        const childUserId = userIdMap.get(child.userId)!;
        await prisma.comment.create({
          data: {
            content: child.content,
            userId: childUserId,
            buildId: firstBuildId,
            parentId: comment.id,
            likeCount: child.likes,
            createdAt: new Date(child.createdAt),
          },
        });
        console.log(`    + Reply by ${child.username}: "${child.content.substring(0, 50)}..."`);
      }
    }
  }

  console.log("\nSeed complete!");
  console.log(`  Users:      ${userIdMap.size}`);
  console.log(`  Badges:     ${allBadges.size}`);
  console.log(`  Builds:     ${buildIdMap.size}`);
  console.log(`  Categories: ${categoryIdMap.size}`);
  console.log(`  Threads:    ${threadIdMap.size}`);
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
