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

// Product photos from Gunpla Wiki (gunpla.fandom.com) — unique per kit grade
const GP = "https://static.wikia.nocookie.net/gunplabuilders/images";

const kits: KitData[] = [
  // Universal Century - RX-78-2 variants
  { name: "RX-78-2 Gundam", seriesName: "Universal Century", grade: "HG", scale: "1/144", releaseYear: 2015, manufacturer: "Bandai", imageUrl: `${GP}/0/03/HGUC-RX-78-2-Revive-1.jpg` },
  { name: "RX-78-2 Gundam", seriesName: "Universal Century", grade: "RG", scale: "1/144", releaseYear: 2010, manufacturer: "Bandai", imageUrl: `${GP}/b/b6/RG-RX-78-2-Gundam-2.0-1.jpg` },
  { name: "RX-78-2 Gundam Ver.3.0", seriesName: "Universal Century", grade: "MG", scale: "1/100", releaseYear: 2013, manufacturer: "Bandai", imageUrl: `${GP}/a/a2/MG-RX-78-2-Gundam-Ver.3.0-1.jpg` },
  { name: "RX-78-2 Gundam", seriesName: "Universal Century", grade: "PG", scale: "1/60", releaseYear: 1998, manufacturer: "Bandai", imageUrl: `${GP}/0/08/PG-RX-78-2-Gundam-1.jpg` },

  // Universal Century - Zeon suits
  { name: "MS-06S Zaku II", seriesName: "Universal Century", grade: "RG", scale: "1/144", releaseYear: 2012, manufacturer: "Bandai", imageUrl: `${GP}/9/93/RG_Char%27s_Zaku_II_1.jpg` },
  { name: "MS-06S Zaku II Ver.2.0", seriesName: "Universal Century", grade: "MG", scale: "1/100", releaseYear: 2007, manufacturer: "Bandai", imageUrl: `${GP}/2/2c/MG_Char%27s_Zaku_II_2.0_01.jpg` },
  { name: "MSN-06S Sinanju", seriesName: "Universal Century", grade: "RG", scale: "1/144", releaseYear: 2016, manufacturer: "Bandai", imageUrl: `${GP}/5/56/RG-Sinanju-1.jpg` },
  { name: "MSN-06S Sinanju Ver.Ka", seriesName: "Universal Century", grade: "MG", scale: "1/100", releaseYear: 2012, manufacturer: "Bandai", imageUrl: `${GP}/2/27/MG-Sinanju-Ver-Ka-1.jpg` },

  // Universal Century - Char's Counterattack
  { name: "RX-93 Nu Gundam", seriesName: "Universal Century", grade: "RG", scale: "1/144", releaseYear: 2019, manufacturer: "Bandai", imageUrl: `${GP}/0/0b/RG-Nu-Gundam-1.jpg` },
  { name: "RX-93 Nu Gundam Ver.Ka", seriesName: "Universal Century", grade: "MG", scale: "1/100", releaseYear: 2012, manufacturer: "Bandai", imageUrl: `${GP}/9/9b/MG-Nu-Gundam-Ver-Ka-1.jpg` },
  { name: "MSN-04 Sazabi Ver.Ka", seriesName: "Universal Century", grade: "MG", scale: "1/100", releaseYear: 2013, manufacturer: "Bandai", imageUrl: `${GP}/c/c6/MG-Sazabi-Ver-Ka-1.jpg` },

  // Universal Century - Unicorn
  { name: "RX-0 Unicorn Gundam", seriesName: "Universal Century", grade: "RG", scale: "1/144", releaseYear: 2017, manufacturer: "Bandai", imageUrl: `${GP}/a/ab/RG_Unicorn_%28Destroy_mode%29_01.jpg` },
  { name: "RX-0 Unicorn Gundam Ver.Ka", seriesName: "Universal Century", grade: "MG", scale: "1/100", releaseYear: 2014, manufacturer: "Bandai", imageUrl: `${GP}/1/1a/MG-Unicorn-Gundam-Ver.Ka-1.jpg` },

  // After Colony - Wing
  { name: "XXXG-01W Wing Gundam Zero EW", seriesName: "After Colony", grade: "RG", scale: "1/144", releaseYear: 2020, manufacturer: "Bandai", imageUrl: `${GP}/d/d7/RG_Wing_Gundam_Zero_01.jpg` },
  { name: "XXXG-01W Wing Gundam Zero EW Ver.Ka", seriesName: "After Colony", grade: "MG", scale: "1/100", releaseYear: 2004, manufacturer: "Bandai", imageUrl: `${GP}/6/6f/MG_Wing_Gundam_Zero_EW_Ver.Ka_01.jpg` },
  { name: "XXXG-00W0 Wing Gundam Zero", seriesName: "After Colony", grade: "HG", scale: "1/144", releaseYear: 2014, manufacturer: "Bandai", imageUrl: `${GP}/c/c8/HGAC-Wing-Gundam-Zero-1.jpg` },

  // Cosmic Era - SEED
  { name: "ZGMF-X10A Freedom Gundam", seriesName: "Cosmic Era", grade: "RG", scale: "1/144", releaseYear: 2015, manufacturer: "Bandai", imageUrl: `${GP}/e/ec/RG_Freedom_Gundam_1.jpg` },
  { name: "ZGMF-X10A Freedom Gundam Ver.2.0", seriesName: "Cosmic Era", grade: "MG", scale: "1/100", releaseYear: 2016, manufacturer: "Bandai", imageUrl: `${GP}/5/50/MG-Freedom-Gundam-%282.0%29-1.jpg` },
  { name: "ZGMF-X42S Destiny Gundam", seriesName: "Cosmic Era", grade: "RG", scale: "1/144", releaseYear: 2018, manufacturer: "Bandai", imageUrl: `${GP}/6/6c/RG_Destiny_01.jpg` },
  { name: "STTS-909 Rising Freedom Gundam", seriesName: "Cosmic Era", grade: "HG", scale: "1/144", releaseYear: 2024, manufacturer: "Bandai", imageUrl: `${GP}/2/2e/HGCE-Rising-Freedom-Gundam-1.jpg` },

  // Anno Domini - 00
  { name: "GN-001 Gundam Exia", seriesName: "Anno Domini", grade: "RG", scale: "1/144", releaseYear: 2016, manufacturer: "Bandai", imageUrl: `${GP}/3/3e/RG_Gundam_Exia_01.jpeg` },
  { name: "GN-001 Gundam Exia", seriesName: "Anno Domini", grade: "MG", scale: "1/100", releaseYear: 2009, manufacturer: "Bandai", imageUrl: `${GP}/d/d7/MG_Gundam_Exia_1.jpg` },
  { name: "GN-0000+GNR-010 00 Raiser", seriesName: "Anno Domini", grade: "MG", scale: "1/100", releaseYear: 2013, manufacturer: "Bandai", imageUrl: `${GP}/5/52/MG-00-Raiser-1.jpg` },
  { name: "GNT-0000 00 Qan[T]", seriesName: "Anno Domini", grade: "RG", scale: "1/144", releaseYear: 2021, manufacturer: "Bandai", imageUrl: `${GP}/6/6f/RG_00_Qan-T_01.jpg` },

  // Post Disaster - IBO
  { name: "ASW-G-08 Gundam Barbatos", seriesName: "Post Disaster", grade: "HG", scale: "1/144", releaseYear: 2015, manufacturer: "Bandai", imageUrl: `${GP}/e/eb/HGI-BO-Gundam-Barbatos-1.jpg` },
  { name: "ASW-G-08 Gundam Barbatos", seriesName: "Post Disaster", grade: "MG", scale: "1/100", releaseYear: 2019, manufacturer: "Bandai", imageUrl: `${GP}/9/94/MG_Barbatos_01.jpg` },
  { name: "ASW-G-08 Gundam Barbatos Lupus Rex", seriesName: "Post Disaster", grade: "HG", scale: "1/144", releaseYear: 2017, manufacturer: "Bandai", imageUrl: `${GP}/0/0d/HGI-BO-Gundam-Barbatos-Lupus-Rex-1.jpg` },
  { name: "ASW-G-08 Gundam Barbatos", seriesName: "Post Disaster", grade: "FM", scale: "1/100", releaseYear: 2015, manufacturer: "Bandai", imageUrl: `${GP}/7/74/1-100-Gundam-Barbatos-01.jpg` },

  // Ad Stella - Witch from Mercury
  { name: "XVX-016 Gundam Aerial", seriesName: "Ad Stella", grade: "HG", scale: "1/144", releaseYear: 2022, manufacturer: "Bandai", imageUrl: `${GP}/e/e7/HGTWFM-Gundam-Aerial-1.jpg` },
  { name: "XVX-016RN Gundam Aerial Rebuild", seriesName: "Ad Stella", grade: "HG", scale: "1/144", releaseYear: 2023, manufacturer: "Bandai", imageUrl: `${GP}/8/8c/HGTWFM-Gundam-Aerial-Rebuild-1.jpg` },
  { name: "XVX-016 Gundam Aerial", seriesName: "Ad Stella", grade: "FM", scale: "1/100", releaseYear: 2023, manufacturer: "Bandai", imageUrl: `${GP}/6/6d/FM-Gundam-Aerial-1.jpg` },
  { name: "MD-0064 Darilbalde", seriesName: "Ad Stella", grade: "HG", scale: "1/144", releaseYear: 2023, manufacturer: "Bandai", imageUrl: `${GP}/d/db/HGTWFM-Darilbalde-1.jpg` },
  { name: "XGF-02 Gundam Lfrith", seriesName: "Ad Stella", grade: "HG", scale: "1/144", releaseYear: 2023, manufacturer: "Bandai", imageUrl: `${GP}/b/b3/HGTWFM-Gundam-Lfrith-1.jpg` },

  // SD
  { name: "SD Gundam EX-Standard RX-78-2", seriesName: "Universal Century", grade: "SD", scale: null, releaseYear: 2016, manufacturer: "Bandai", imageUrl: null },
];

async function seedKits() {
  console.log("Seeding Gunpla kits...");

  for (const kit of kits) {
    const slug = slugify(`${kit.name}-${kit.grade}`);

    await prisma.gunplaKit.upsert({
      where: { slug },
      update: {
        imageUrl: kit.imageUrl,
      },
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
