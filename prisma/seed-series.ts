import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GUNDAM_SERIES = [
  // ─── Universal Century ────────────────────────────────────────
  { name: "Mobile Suit Gundam", japaneseTitle: "機動戦士ガンダム", timeline: "Universal Century", yearStart: 1979, yearEnd: 1980, abbreviation: "MSG", sortOrder: 1 },
  { name: "Mobile Suit Zeta Gundam", japaneseTitle: "機動戦士Ζガンダム", timeline: "Universal Century", yearStart: 1985, yearEnd: 1986, abbreviation: "Zeta", sortOrder: 2 },
  { name: "Mobile Suit Gundam ZZ", japaneseTitle: "機動戦士ガンダムΖΖ", timeline: "Universal Century", yearStart: 1986, yearEnd: 1987, abbreviation: "ZZ", sortOrder: 3 },
  { name: "Mobile Suit Gundam: Char's Counterattack", japaneseTitle: "機動戦士ガンダム 逆襲のシャア", timeline: "Universal Century", yearStart: 1988, yearEnd: 1988, abbreviation: "CCA", sortOrder: 4 },
  { name: "Mobile Suit Gundam 0080: War in the Pocket", japaneseTitle: "機動戦士ガンダム0080 ポケットの中の戦争", timeline: "Universal Century", yearStart: 1989, yearEnd: 1989, abbreviation: "0080", sortOrder: 5 },
  { name: "Mobile Suit Gundam 0083: Stardust Memory", japaneseTitle: "機動戦士ガンダム0083 STARDUST MEMORY", timeline: "Universal Century", yearStart: 1991, yearEnd: 1992, abbreviation: "0083", sortOrder: 6 },
  { name: "Mobile Suit Gundam F91", japaneseTitle: "機動戦士ガンダムF91", timeline: "Universal Century", yearStart: 1991, yearEnd: 1991, abbreviation: "F91", sortOrder: 7 },
  { name: "Mobile Suit Victory Gundam", japaneseTitle: "機動戦士Vガンダム", timeline: "Universal Century", yearStart: 1993, yearEnd: 1994, abbreviation: "Victory", sortOrder: 8 },
  { name: "Mobile Suit Gundam: The 08th MS Team", japaneseTitle: "機動戦士ガンダム 第08MS小隊", timeline: "Universal Century", yearStart: 1996, yearEnd: 1999, abbreviation: "08th MS", sortOrder: 9 },
  { name: "Mobile Suit Gundam Unicorn", japaneseTitle: "機動戦士ガンダムUC", timeline: "Universal Century", yearStart: 2010, yearEnd: 2014, abbreviation: "UC", sortOrder: 10 },
  { name: "Mobile Suit Gundam: The Origin", japaneseTitle: "機動戦士ガンダム THE ORIGIN", timeline: "Universal Century", yearStart: 2015, yearEnd: 2018, abbreviation: "Origin", sortOrder: 11 },
  { name: "Mobile Suit Gundam Thunderbolt", japaneseTitle: "機動戦士ガンダム サンダーボルト", timeline: "Universal Century", yearStart: 2015, yearEnd: 2017, abbreviation: "TB", sortOrder: 12 },
  { name: "Mobile Suit Gundam NT (Narrative)", japaneseTitle: "機動戦士ガンダムNT", timeline: "Universal Century", yearStart: 2018, yearEnd: 2018, abbreviation: "NT", sortOrder: 13 },
  { name: "Mobile Suit Gundam: Hathaway's Flash", japaneseTitle: "機動戦士ガンダム 閃光のハサウェイ", timeline: "Universal Century", yearStart: 2021, yearEnd: null, abbreviation: "Hathaway", sortOrder: 14 },
  { name: "Mobile Suit Gundam: Requiem for Vengeance", japaneseTitle: "機動戦士ガンダム 復讐のレクイエム", timeline: "Universal Century", yearStart: 2024, yearEnd: 2024, abbreviation: "RfV", sortOrder: 15 },

  // ─── Future Century ───────────────────────────────────────────
  { name: "Mobile Fighter G Gundam", japaneseTitle: "機動武闘伝Gガンダム", timeline: "Future Century", yearStart: 1994, yearEnd: 1995, abbreviation: "G", sortOrder: 20 },

  // ─── After Colony ─────────────────────────────────────────────
  { name: "Mobile Suit Gundam Wing", japaneseTitle: "新機動戦記ガンダムW", timeline: "After Colony", yearStart: 1995, yearEnd: 1996, abbreviation: "Wing", sortOrder: 25 },
  { name: "Mobile Suit Gundam Wing: Endless Waltz", japaneseTitle: "新機動戦記ガンダムW Endless Waltz", timeline: "After Colony", yearStart: 1997, yearEnd: 1997, abbreviation: "EW", sortOrder: 26 },

  // ─── After War ────────────────────────────────────────────────
  { name: "After War Gundam X", japaneseTitle: "機動新世紀ガンダムX", timeline: "After War", yearStart: 1996, yearEnd: 1996, abbreviation: "X", sortOrder: 30 },

  // ─── Correct Century ──────────────────────────────────────────
  { name: "Turn A Gundam", japaneseTitle: "∀ガンダム", timeline: "Correct Century", yearStart: 1999, yearEnd: 2000, abbreviation: "Turn A", sortOrder: 35 },

  // ─── Cosmic Era ───────────────────────────────────────────────
  { name: "Mobile Suit Gundam SEED", japaneseTitle: "機動戦士ガンダムSEED", timeline: "Cosmic Era", yearStart: 2002, yearEnd: 2003, abbreviation: "SEED", sortOrder: 40 },
  { name: "Mobile Suit Gundam SEED Destiny", japaneseTitle: "機動戦士ガンダムSEED DESTINY", timeline: "Cosmic Era", yearStart: 2004, yearEnd: 2005, abbreviation: "Destiny", sortOrder: 41 },
  { name: "Mobile Suit Gundam SEED Astray", japaneseTitle: "機動戦士ガンダムSEED ASTRAY", timeline: "Cosmic Era", yearStart: 2003, yearEnd: 2004, abbreviation: "Astray", sortOrder: 42 },
  { name: "Mobile Suit Gundam SEED Freedom", japaneseTitle: "機動戦士ガンダムSEED FREEDOM", timeline: "Cosmic Era", yearStart: 2024, yearEnd: 2024, abbreviation: "Freedom", sortOrder: 43 },

  // ─── Anno Domini ──────────────────────────────────────────────
  { name: "Mobile Suit Gundam 00", japaneseTitle: "機動戦士ガンダム00", timeline: "Anno Domini", yearStart: 2007, yearEnd: 2009, abbreviation: "00", sortOrder: 50 },
  { name: "Mobile Suit Gundam 00: A Wakening of the Trailblazer", japaneseTitle: "劇場版 機動戦士ガンダム00", timeline: "Anno Domini", yearStart: 2010, yearEnd: 2010, abbreviation: "00 Movie", sortOrder: 51 },

  // ─── Advanced Generation ──────────────────────────────────────
  { name: "Mobile Suit Gundam AGE", japaneseTitle: "機動戦士ガンダムAGE", timeline: "Advanced Generation", yearStart: 2011, yearEnd: 2012, abbreviation: "AGE", sortOrder: 55 },

  // ─── Regild Century ───────────────────────────────────────────
  { name: "Gundam Reconguista in G", japaneseTitle: "ガンダム Gのレコンギスタ", timeline: "Regild Century", yearStart: 2014, yearEnd: 2015, abbreviation: "G-Reco", sortOrder: 60 },

  // ─── Post Disaster ────────────────────────────────────────────
  { name: "Mobile Suit Gundam Iron-Blooded Orphans", japaneseTitle: "機動戦士ガンダム 鉄血のオルフェンズ", timeline: "Post Disaster", yearStart: 2015, yearEnd: 2017, abbreviation: "IBO", sortOrder: 65 },
  { name: "Mobile Suit Gundam Iron-Blooded Orphans: Urdr-Hunt", japaneseTitle: "機動戦士ガンダム 鉄血のオルフェンズ ウルズハント", timeline: "Post Disaster", yearStart: 2022, yearEnd: 2022, abbreviation: "Urdr", sortOrder: 66 },

  // ─── Ad Stella ────────────────────────────────────────────────
  { name: "Mobile Suit Gundam: The Witch from Mercury", japaneseTitle: "機動戦士ガンダム 水星の魔女", timeline: "Ad Stella", yearStart: 2022, yearEnd: 2023, abbreviation: "WfM", sortOrder: 70 },

  // ─── Build Series ─────────────────────────────────────────────
  { name: "Gundam Build Fighters", japaneseTitle: "ガンダムビルドファイターズ", timeline: "Build Series", yearStart: 2013, yearEnd: 2014, abbreviation: "BF", sortOrder: 80 },
  { name: "Gundam Build Fighters Try", japaneseTitle: "ガンダムビルドファイターズトライ", timeline: "Build Series", yearStart: 2014, yearEnd: 2015, abbreviation: "BFT", sortOrder: 81 },
  { name: "Gundam Build Divers", japaneseTitle: "ガンダムビルドダイバーズ", timeline: "Build Series", yearStart: 2018, yearEnd: 2018, abbreviation: "BD", sortOrder: 82 },
  { name: "Gundam Build Divers Re:RISE", japaneseTitle: "ガンダムビルドダイバーズRe:RISE", timeline: "Build Series", yearStart: 2019, yearEnd: 2020, abbreviation: "Re:RISE", sortOrder: 83 },
  { name: "Gundam Build Metaverse", japaneseTitle: "ガンダムビルドメタバース", timeline: "Build Series", yearStart: 2023, yearEnd: 2023, abbreviation: "Meta", sortOrder: 84 },
  { name: "Gundam Breaker Battlogue", japaneseTitle: "ガンダムブレイカー バトローグ", timeline: "Build Series", yearStart: 2021, yearEnd: 2021, abbreviation: "BBL", sortOrder: 85 },

  // ─── SD Gundam ────────────────────────────────────────────────
  { name: "SD Gundam Force", japaneseTitle: "SDガンダムフォース", timeline: "Build Series", yearStart: 2004, yearEnd: 2004, abbreviation: "SDF", sortOrder: 90 },
  { name: "SD Gundam World Heroes", japaneseTitle: "SDガンダムワールド ヒーローズ", timeline: "Build Series", yearStart: 2021, yearEnd: 2021, abbreviation: "SDW", sortOrder: 91 },
  { name: "SD Gundam World: Sangoku Soketsuden", japaneseTitle: "SDガンダムワールド 三国創傑伝", timeline: "Build Series", yearStart: 2019, yearEnd: 2019, abbreviation: "Sangoku", sortOrder: 92 },

  // ─── Standalone / Other ───────────────────────────────────────
  { name: "Gundam Evolve", japaneseTitle: "GUNDAM EVOLVE", timeline: "Universal Century", yearStart: 2001, yearEnd: 2007, abbreviation: "Evolve", sortOrder: 95 },
  { name: "Model Suit Gunpla Builders Beginning G", japaneseTitle: "模型戦士ガンプラビルダーズ ビギニングG", timeline: "Build Series", yearStart: 2010, yearEnd: 2010, abbreviation: "BBG", sortOrder: 96 },
];

async function main() {
  console.log("Seeding Gundam series...");

  for (const series of GUNDAM_SERIES) {
    await prisma.gundamSeries.upsert({
      where: { name: series.name },
      update: {
        japaneseTitle: series.japaneseTitle,
        timeline: series.timeline,
        yearStart: series.yearStart,
        yearEnd: series.yearEnd,
        abbreviation: series.abbreviation,
        sortOrder: series.sortOrder,
      },
      create: series,
    });
  }

  console.log(`Seeded ${GUNDAM_SERIES.length} series.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
