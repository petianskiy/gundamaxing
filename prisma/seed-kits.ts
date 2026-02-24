import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface KitData {
  name: string;
  seriesName: string;
  grade: string;
  scale: string | null;
  releaseYear: number | null;
  manufacturer: string;
  imageUrl: string | null;
}

const kits: KitData[] = [
  // Universal Century - RX-78-2 variants
  { name: "RX-78-2 Gundam", seriesName: "Universal Century", grade: "HG", scale: "1/144", releaseYear: 2015, manufacturer: "Bandai", imageUrl: null },
  { name: "RX-78-2 Gundam", seriesName: "Universal Century", grade: "RG", scale: "1/144", releaseYear: 2010, manufacturer: "Bandai", imageUrl: null },
  { name: "RX-78-2 Gundam Ver.3.0", seriesName: "Universal Century", grade: "MG", scale: "1/100", releaseYear: 2013, manufacturer: "Bandai", imageUrl: null },
  { name: "RX-78-2 Gundam", seriesName: "Universal Century", grade: "PG", scale: "1/60", releaseYear: 1998, manufacturer: "Bandai", imageUrl: null },

  // Universal Century - Zeon suits
  { name: "MS-06S Zaku II", seriesName: "Universal Century", grade: "RG", scale: "1/144", releaseYear: 2012, manufacturer: "Bandai", imageUrl: null },
  { name: "MS-06S Zaku II Ver.2.0", seriesName: "Universal Century", grade: "MG", scale: "1/100", releaseYear: 2007, manufacturer: "Bandai", imageUrl: null },
  { name: "MSN-06S Sinanju", seriesName: "Universal Century", grade: "RG", scale: "1/144", releaseYear: 2016, manufacturer: "Bandai", imageUrl: null },
  { name: "MSN-06S Sinanju Ver.Ka", seriesName: "Universal Century", grade: "MG", scale: "1/100", releaseYear: 2012, manufacturer: "Bandai", imageUrl: null },

  // Universal Century - Char's Counterattack
  { name: "RX-93 Nu Gundam", seriesName: "Universal Century", grade: "RG", scale: "1/144", releaseYear: 2019, manufacturer: "Bandai", imageUrl: null },
  { name: "RX-93 Nu Gundam Ver.Ka", seriesName: "Universal Century", grade: "MG", scale: "1/100", releaseYear: 2012, manufacturer: "Bandai", imageUrl: null },
  { name: "MSN-04 Sazabi Ver.Ka", seriesName: "Universal Century", grade: "MG", scale: "1/100", releaseYear: 2013, manufacturer: "Bandai", imageUrl: null },

  // Universal Century - Unicorn
  { name: "RX-0 Unicorn Gundam", seriesName: "Universal Century", grade: "RG", scale: "1/144", releaseYear: 2017, manufacturer: "Bandai", imageUrl: null },
  { name: "RX-0 Unicorn Gundam Ver.Ka", seriesName: "Universal Century", grade: "MG", scale: "1/100", releaseYear: 2014, manufacturer: "Bandai", imageUrl: null },

  // After Colony - Wing
  { name: "XXXG-01W Wing Gundam Zero EW", seriesName: "After Colony", grade: "RG", scale: "1/144", releaseYear: 2020, manufacturer: "Bandai", imageUrl: null },
  { name: "XXXG-01W Wing Gundam Zero EW Ver.Ka", seriesName: "After Colony", grade: "MG", scale: "1/100", releaseYear: 2004, manufacturer: "Bandai", imageUrl: null },
  { name: "XXXG-00W0 Wing Gundam Zero", seriesName: "After Colony", grade: "HG", scale: "1/144", releaseYear: 2014, manufacturer: "Bandai", imageUrl: null },

  // Cosmic Era - SEED
  { name: "ZGMF-X10A Freedom Gundam", seriesName: "Cosmic Era", grade: "RG", scale: "1/144", releaseYear: 2015, manufacturer: "Bandai", imageUrl: null },
  { name: "ZGMF-X10A Freedom Gundam Ver.2.0", seriesName: "Cosmic Era", grade: "MG", scale: "1/100", releaseYear: 2016, manufacturer: "Bandai", imageUrl: null },
  { name: "ZGMF-X42S Destiny Gundam", seriesName: "Cosmic Era", grade: "RG", scale: "1/144", releaseYear: 2018, manufacturer: "Bandai", imageUrl: null },
  { name: "STTS-909 Rising Freedom Gundam", seriesName: "Cosmic Era", grade: "HG", scale: "1/144", releaseYear: 2024, manufacturer: "Bandai", imageUrl: null },

  // Anno Domini - 00
  { name: "GN-001 Gundam Exia", seriesName: "Anno Domini", grade: "RG", scale: "1/144", releaseYear: 2016, manufacturer: "Bandai", imageUrl: null },
  { name: "GN-001 Gundam Exia", seriesName: "Anno Domini", grade: "MG", scale: "1/100", releaseYear: 2009, manufacturer: "Bandai", imageUrl: null },
  { name: "GN-0000+GNR-010 00 Raiser", seriesName: "Anno Domini", grade: "MG", scale: "1/100", releaseYear: 2013, manufacturer: "Bandai", imageUrl: null },
  { name: "GNT-0000 00 Qan[T]", seriesName: "Anno Domini", grade: "RG", scale: "1/144", releaseYear: 2021, manufacturer: "Bandai", imageUrl: null },

  // Post Disaster - IBO
  { name: "ASW-G-08 Gundam Barbatos", seriesName: "Post Disaster", grade: "HG", scale: "1/144", releaseYear: 2015, manufacturer: "Bandai", imageUrl: null },
  { name: "ASW-G-08 Gundam Barbatos", seriesName: "Post Disaster", grade: "MG", scale: "1/100", releaseYear: 2019, manufacturer: "Bandai", imageUrl: null },
  { name: "ASW-G-08 Gundam Barbatos Lupus Rex", seriesName: "Post Disaster", grade: "HG", scale: "1/144", releaseYear: 2017, manufacturer: "Bandai", imageUrl: null },
  { name: "ASW-G-08 Gundam Barbatos", seriesName: "Post Disaster", grade: "FM", scale: "1/100", releaseYear: 2015, manufacturer: "Bandai", imageUrl: null },

  // Ad Stella - Witch from Mercury
  { name: "XVX-016 Gundam Aerial", seriesName: "Ad Stella", grade: "HG", scale: "1/144", releaseYear: 2022, manufacturer: "Bandai", imageUrl: null },
  { name: "XVX-016RN Gundam Aerial Rebuild", seriesName: "Ad Stella", grade: "HG", scale: "1/144", releaseYear: 2023, manufacturer: "Bandai", imageUrl: null },
  { name: "XVX-016 Gundam Aerial", seriesName: "Ad Stella", grade: "FM", scale: "1/100", releaseYear: 2023, manufacturer: "Bandai", imageUrl: null },
  { name: "MD-0064 Darilbalde", seriesName: "Ad Stella", grade: "HG", scale: "1/144", releaseYear: 2023, manufacturer: "Bandai", imageUrl: null },
  { name: "XGF-02 Gundam Lfrith", seriesName: "Ad Stella", grade: "HG", scale: "1/144", releaseYear: 2023, manufacturer: "Bandai", imageUrl: null },

  // SD
  { name: "SD Gundam EX-Standard RX-78-2", seriesName: "Universal Century", grade: "SD", scale: null, releaseYear: 2016, manufacturer: "Bandai", imageUrl: null },
];

async function seedKits() {
  console.log("Seeding Gunpla kits...");

  for (const kit of kits) {
    const slug = slugify(`${kit.name}-${kit.grade}`);

    await prisma.gunplaKit.upsert({
      where: { slug },
      update: {},
      create: {
        name: kit.name,
        seriesName: kit.seriesName,
        grade: kit.grade,
        scale: kit.scale,
        releaseYear: kit.releaseYear,
        manufacturer: kit.manufacturer,
        imageUrl: kit.imageUrl,
        slug,
      },
    });
  }

  console.log(`Seeded ${kits.length} Gunpla kits.`);
}

seedKits()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
