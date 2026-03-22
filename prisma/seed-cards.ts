import { PrismaClient, CardProductType } from "@prisma/client";

const prisma = new PrismaClient();

interface CardEntry {
  code: string;
  name: string;
  type: CardProductType;
  seriesTheme?: string;
  releaseDate?: string; // ISO date
  price?: number;
  description?: string;
  imageUrl?: string;
  officialUrl?: string;
  isFeatured?: boolean;
}

const OFFICIAL_BASE = "https://www.gundam-gcg.com";

const CARDS: CardEntry[] = [
  // ─── Starter Decks ─────────────────────────────────────────
  {
    code: "ST01", name: "Crimson Blaze", type: "STARTER_DECK",
    seriesTheme: "Mobile Suit Gundam",
    releaseDate: "2025-07-11", price: 15.99,
    description: "A starter deck built around the original Mobile Suit Gundam universe.",
    officialUrl: `${OFFICIAL_BASE}/en/products/st01.php`,
  },
  {
    code: "ST02", name: "Azure Tempest", type: "STARTER_DECK",
    seriesTheme: "Mobile Suit Zeta Gundam",
    releaseDate: "2025-07-11", price: 15.99,
    description: "A starter deck featuring the Zeta Gundam saga.",
    officialUrl: `${OFFICIAL_BASE}/en/products/st02.php`,
  },
  {
    code: "ST03", name: "Verdant Wing", type: "STARTER_DECK",
    seriesTheme: "Mobile Suit Gundam Wing",
    releaseDate: "2025-07-11", price: 15.99,
    description: "Enter the battlefield with Gundam Wing's iconic mobile suits.",
    officialUrl: `${OFFICIAL_BASE}/en/products/st03.php`,
  },
  {
    code: "ST04", name: "Witch's Veil", type: "STARTER_DECK",
    seriesTheme: "Mobile Suit Gundam: The Witch from Mercury",
    releaseDate: "2025-07-11", price: 15.99,
    description: "A starter deck featuring Suletta Mercury and the Witch from Mercury cast.",
    officialUrl: `${OFFICIAL_BASE}/en/products/st04.php`,
  },
  {
    code: "ST05", name: "Iron Bloom", type: "STARTER_DECK",
    seriesTheme: "Mobile Suit Gundam: Iron-Blooded Orphans",
    releaseDate: "2025-09-26", price: 15.99,
    description: "Fight alongside Tekkadan with Iron-Blooded Orphans mobile suits.",
    officialUrl: `${OFFICIAL_BASE}/en/products/st05.php`,
  },
  {
    code: "ST06", name: "Clan Unity", type: "STARTER_DECK",
    seriesTheme: "Mobile Fighter G Gundam",
    releaseDate: "2025-10-24", price: 15.99,
    description: "Unite the clans of G Gundam in this strategic starter deck.",
    officialUrl: `${OFFICIAL_BASE}/en/products/st06.php`,
  },
  {
    code: "ST07", name: "Celestial Drive", type: "STARTER_DECK",
    seriesTheme: "Mobile Suit Gundam 00",
    releaseDate: "2026-01-16", price: 15.99,
    description: "Command Celestial Being with Link Units from Gundam 00.",
    officialUrl: `${OFFICIAL_BASE}/en/products/st07.php`,
  },
  {
    code: "ST08", name: "Flash of Radiance", type: "STARTER_DECK",
    seriesTheme: "Mobile Suit Gundam: Hathaway",
    releaseDate: "2026-01-16", price: 15.99,
    description: "Blend Red damage and Blue support strategies from Hathaway's Flash.",
    officialUrl: `${OFFICIAL_BASE}/en/products/st08.php`,
  },
  {
    code: "ST09", name: "Destiny Ignition", type: "STARTER_DECK",
    seriesTheme: "Mobile Suit Gundam SEED DESTINY",
    releaseDate: "2026-03-27", price: 39.99, isFeatured: true,
    description: "Ultimate deck featuring Kira, Athrun, and Shinn from SEED DESTINY.",
    officialUrl: `${OFFICIAL_BASE}/en/products/st09.php`,
  },
  {
    code: "ST10", name: "Generation Pulse", type: "STARTER_DECK",
    seriesTheme: "Gundam Build Series",
    releaseDate: "2026-06-26", price: 15.99,
    officialUrl: `${OFFICIAL_BASE}/en/products/st10.php`,
  },
  {
    code: "ST11", name: "Aquatic Assault", type: "STARTER_DECK",
    releaseDate: "2026-09-25",
    officialUrl: `${OFFICIAL_BASE}/en/products/st11.php`,
  },
  {
    code: "ST12", name: "Raging Onslaught", type: "STARTER_DECK",
    releaseDate: "2026-09-25",
    officialUrl: `${OFFICIAL_BASE}/en/products/st12.php`,
  },
  {
    code: "ST13", name: "Silent Barrage", type: "STARTER_DECK",
    releaseDate: "2026-09-25",
    officialUrl: `${OFFICIAL_BASE}/en/products/st13.php`,
  },
  {
    code: "ST14", name: "Heavy Dominion", type: "STARTER_DECK",
    releaseDate: "2026-09-25",
    officialUrl: `${OFFICIAL_BASE}/en/products/st14.php`,
  },

  // ─── Booster Packs ────────────────────────────────────────
  {
    code: "GD01", name: "Newtype Rising", type: "BOOSTER_PACK",
    releaseDate: "2025-07-25", price: 4.99,
    description: "The first booster pack featuring cards from across the Gundam multiverse.",
    officialUrl: `${OFFICIAL_BASE}/en/products/gd01.php`,
  },
  {
    code: "GD02", name: "Dual Impact", type: "BOOSTER_PACK",
    releaseDate: "2025-10-24", price: 4.99,
    description: "Expand your collection with new strategies and iconic mobile suits.",
    officialUrl: `${OFFICIAL_BASE}/en/products/gd02.php`,
  },
  {
    code: "GD03", name: "Steel Requiem", type: "BOOSTER_PACK",
    releaseDate: "2026-01-30", price: 4.99, isFeatured: true,
    description: "Special reprints with new illustrations and powered-up cards.",
    officialUrl: `${OFFICIAL_BASE}/en/products/gd03.php`,
  },
  {
    code: "GD04", name: "Phantom Aria", type: "BOOSTER_PACK",
    seriesTheme: "Victory Gundam / Turn A Gundam",
    releaseDate: "2026-04-24", price: 4.99, isFeatured: true,
    description: "Introducing Victory Gundam and Turn A Gundam to the card game.",
    officialUrl: `${OFFICIAL_BASE}/en/products/gd04.php`,
  },
  {
    code: "GD05", name: "Freedom Ascension", type: "BOOSTER_PACK",
    releaseDate: "2026-07-24", price: 4.99,
    officialUrl: `${OFFICIAL_BASE}/en/products/gd05.php`,
  },
  {
    code: "GD06", name: "Booster Pack 06", type: "BOOSTER_PACK",
    releaseDate: "2026-10-23",
    officialUrl: `${OFFICIAL_BASE}/en/products/gd06.php`,
  },
  {
    code: "EB01", name: "Eternal Nexus", type: "BOOSTER_PACK",
    releaseDate: "2026-06-26", price: 4.99,
    officialUrl: `${OFFICIAL_BASE}/en/products/eb01.php`,
  },

  // ─── Premium / Limited ─────────────────────────────────────
  {
    code: "PC01A", name: "GUNDAM ASSEMBLE Set (Iron-Blooded Orphans)", type: "PREMIUM_COLLECTION",
    seriesTheme: "Mobile Suit Gundam: Iron-Blooded Orphans",
    releaseDate: "2026-02-27", price: 39.99,
    description: "Premium collection with Gundam Assemble figures and token cards.",
    officialUrl: `${OFFICIAL_BASE}/en/products/pc01a.php`,
  },
  {
    code: "PC02A", name: "GUNDAM ASSEMBLE Set (GQuuuuuuX)", type: "PREMIUM_COLLECTION",
    seriesTheme: "Mobile Suit Gundam GQuuuuuuX",
    releaseDate: "2026-02-27", price: 39.99,
    description: "Premium collection with Gundam Assemble figures and token cards.",
    officialUrl: `${OFFICIAL_BASE}/en/products/pc02a.php`,
  },
  {
    code: "EVX05", name: "Premium Card Collection", type: "PREMIUM_COLLECTION",
    releaseDate: "2025-12-13", price: 15.00,
    officialUrl: `${OFFICIAL_BASE}/en/products/evx05.php`,
  },
  {
    code: "SC01", name: "Deck Build Box Freedom Ascension", type: "PREMIUM_COLLECTION",
    releaseDate: "2026-07-24", price: 39.99,
    officialUrl: `${OFFICIAL_BASE}/en/products/sc01.php`,
  },
  {
    code: "PB01", name: "Premium Accessory Set (Gundam Wing)", type: "PREMIUM_COLLECTION",
    seriesTheme: "Mobile Suit Gundam Wing",
    releaseDate: "2025-08-20", price: 89.99,
    officialUrl: `${OFFICIAL_BASE}/en/products/pb01.php`,
  },
  {
    code: "PB02", name: "Premium Accessory Set (Iron-Blooded Orphans)", type: "PREMIUM_COLLECTION",
    seriesTheme: "Mobile Suit Gundam: Iron-Blooded Orphans",
    releaseDate: "2025-10-10", price: 89.99,
    officialUrl: `${OFFICIAL_BASE}/en/products/pb02.php`,
  },
  {
    code: "BETA", name: "Edition Beta", type: "LIMITED",
    releaseDate: "2024-12-07", price: 69.99,
    description: "The original limited Edition Beta box that launched the Gundam Card Game.",
    officialUrl: `${OFFICIAL_BASE}/en/products/edition-beta.php`,
  },

  // ─── Accessories ───────────────────────────────────────────
  {
    code: "EVX01", name: "Accessory and Card Set 01 FIRST COMBAT", type: "ACCESSORIES",
    releaseDate: "2025-07-03", price: 69.99,
    officialUrl: `${OFFICIAL_BASE}/en/products/evx01.php`,
  },
  {
    code: "EVX02", name: "Official Playmat and Card Set (Suletta & Miorine)", type: "ACCESSORIES",
    seriesTheme: "Mobile Suit Gundam: The Witch from Mercury",
    releaseDate: "2025-09-20", price: 43.00,
    officialUrl: `${OFFICIAL_BASE}/en/products/evx02.php`,
  },
  {
    code: "EVX03", name: "Official Card Sleeves EX", type: "ACCESSORIES",
    releaseDate: "2025-09-20", price: 9.00,
    officialUrl: `${OFFICIAL_BASE}/en/products/evx03.php`,
  },
];

export async function seedCards() {
  console.log(`Seeding ${CARDS.length} card products...`);
  let created = 0, skipped = 0;

  for (let i = 0; i < CARDS.length; i++) {
    const entry = CARDS[i];
    const existing = await prisma.cardProduct.findUnique({ where: { code: entry.code } });
    if (existing) { skipped++; continue; }

    await prisma.cardProduct.create({
      data: {
        code: entry.code,
        name: entry.name,
        type: entry.type,
        description: entry.description || null,
        seriesTheme: entry.seriesTheme || null,
        releaseDate: entry.releaseDate ? new Date(entry.releaseDate) : null,
        price: entry.price || null,
        imageUrl: entry.imageUrl || null,
        officialUrl: entry.officialUrl || null,
        isFeatured: entry.isFeatured || false,
        sortOrder: i,
      },
    });
    created++;
  }

  console.log(`Cards seeded: ${created} created, ${skipped} already existed.`);
}

if (require.main === module) {
  seedCards()
    .then(() => prisma.$disconnect())
    .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
}
