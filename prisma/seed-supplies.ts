import { PrismaClient, SupplyCategory } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Catalog Definition ──────────────────────────────────────────
// Each entry defines a canonical product + its aliases.
// This is the authoritative source for the supply catalog.

interface SupplyEntry {
  brand: string;
  productLine?: string;
  name: string;
  code?: string;
  category: SupplyCategory;
  subcategory?: string;
  finish?: string;
  solventType?: string;
  colorHex?: string;
  aliases: string[];
}

function slugify(brand: string, name: string, code?: string): string {
  const parts = [brand, name, code].filter(Boolean).join(" ");
  return parts
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

// ─── Mr. Hobby / GSI Creos ──────────────────────────────────────

const mrHobby: SupplyEntry[] = [
  // Mr. Color lacquers
  {
    brand: "Mr. Hobby", productLine: "Mr. Color", name: "White", code: "C1",
    category: "PAINT", finish: "Gloss", solventType: "Lacquer", colorHex: "#ffffff",
    aliases: ["Mr. Color C1", "Mr. Color White", "GSI Creos C1", "C1 White"],
  },
  {
    brand: "Mr. Hobby", productLine: "Mr. Color", name: "Black", code: "C2",
    category: "PAINT", finish: "Gloss", solventType: "Lacquer", colorHex: "#1a1a1a",
    aliases: ["Mr. Color C2", "Mr. Color Black", "GSI Creos C2", "C2 Black"],
  },
  {
    brand: "Mr. Hobby", productLine: "Mr. Color", name: "Red", code: "C3",
    category: "PAINT", finish: "Gloss", solventType: "Lacquer", colorHex: "#cc0000",
    aliases: ["Mr. Color C3", "Mr. Color Red", "GSI Creos C3"],
  },
  {
    brand: "Mr. Hobby", productLine: "Mr. Color", name: "Yellow", code: "C4",
    category: "PAINT", finish: "Gloss", solventType: "Lacquer", colorHex: "#f5c518",
    aliases: ["Mr. Color C4", "Mr. Color Yellow", "GSI Creos C4"],
  },
  {
    brand: "Mr. Hobby", productLine: "Mr. Color", name: "Blue", code: "C5",
    category: "PAINT", finish: "Gloss", solventType: "Lacquer", colorHex: "#0044cc",
    aliases: ["Mr. Color C5", "Mr. Color Blue", "GSI Creos C5"],
  },
  {
    brand: "Mr. Hobby", productLine: "Mr. Color", name: "Character Blue", code: "C110",
    category: "PAINT", finish: "Semi-Gloss", solventType: "Lacquer", colorHex: "#2255bb",
    aliases: ["Mr. Color C110", "C110 Character Blue", "Mr. Color 110", "mr color 110", "mr. color c-110", "Mr Hobby C110"],
  },
  {
    brand: "Mr. Hobby", productLine: "Mr. Color", name: "Character Red", code: "C112",
    category: "PAINT", finish: "Semi-Gloss", solventType: "Lacquer", colorHex: "#cc2222",
    aliases: ["Mr. Color C112", "C112 Character Red"],
  },
  {
    brand: "Mr. Hobby", productLine: "Mr. Color", name: "RLM Gray", code: "C22",
    category: "PAINT", finish: "Semi-Gloss", solventType: "Lacquer", colorHex: "#6b6b6b",
    aliases: ["Mr. Color C22", "C22 Gray"],
  },
  {
    brand: "Mr. Hobby", productLine: "Mr. Color", name: "Dark Gray", code: "C22",
    category: "PAINT", finish: "Semi-Gloss", solventType: "Lacquer", colorHex: "#444444",
    aliases: ["Mr. Color Dark Gray"],
  },
  {
    brand: "Mr. Hobby", productLine: "Mr. Color", name: "Flat White", code: "C62",
    category: "PAINT", finish: "Flat", solventType: "Lacquer", colorHex: "#f0f0f0",
    aliases: ["Mr. Color C62", "C62 Flat White", "Mr. Color Flat White"],
  },
  {
    brand: "Mr. Hobby", productLine: "Mr. Color", name: "Flat Black", code: "C33",
    category: "PAINT", finish: "Flat", solventType: "Lacquer", colorHex: "#1a1a1a",
    aliases: ["Mr. Color C33", "C33 Flat Black"],
  },
  // Aqueous
  {
    brand: "Mr. Hobby", productLine: "Aqueous Hobby Color", name: "Black", code: "H2",
    category: "PAINT", finish: "Gloss", solventType: "Acrylic", colorHex: "#1a1a1a",
    aliases: ["Aqueous H2", "Mr. Hobby Aqueous H2", "H2 Black"],
  },
  {
    brand: "Mr. Hobby", productLine: "Aqueous Hobby Color", name: "Steel", code: "H18",
    category: "PAINT", finish: "Metallic", solventType: "Acrylic", colorHex: "#8a8a8a",
    aliases: ["Aqueous H18", "Mr. Hobby Aqueous H-18", "H18 Steel", "H-18"],
  },
  // Mr. Surfacer
  {
    brand: "Mr. Hobby", productLine: "Mr. Surfacer", name: "Mr. Surfacer 500", code: "SF285",
    category: "PRIMER", solventType: "Lacquer",
    aliases: ["Mr. Surfacer 500", "SF285", "Mr. Hobby Surfacer 500"],
  },
  {
    brand: "Mr. Hobby", productLine: "Mr. Surfacer", name: "Mr. Surfacer 1000", code: "SF284",
    category: "PRIMER", solventType: "Lacquer",
    aliases: ["Mr. Surfacer 1000", "SF284", "Mr. Hobby Surfacer 1000"],
  },
  {
    brand: "Mr. Hobby", productLine: "Mr. Surfacer", name: "Mr. Surfacer 1500 Black", code: "SF288",
    category: "PRIMER", solventType: "Lacquer", colorHex: "#1a1a1a",
    aliases: ["Mr. Surfacer 1500 Black", "SF288", "Mr. Hobby Black Surfacer", "black primer", "Mr Hobby black primer"],
  },
  // Mr. Cement
  {
    brand: "Mr. Hobby", name: "Mr. Cement S", code: "MC129",
    category: "CEMENT",
    aliases: ["Mr. Cement S", "Mr. Hobby Cement", "MC129", "Mr. Cement thin"],
  },
  {
    brand: "Mr. Hobby", name: "Mr. Cement SP (Super Power)", code: "MC131",
    category: "CEMENT",
    aliases: ["Mr. Cement SP", "MC131", "Mr. Cement Super Power"],
  },
  // Topcoat
  {
    brand: "Mr. Hobby", name: "Mr. Super Clear Flat", code: "B514",
    category: "TOPCOAT", finish: "Flat", solventType: "Lacquer",
    aliases: ["Mr. Super Clear Flat", "B514", "MSC Flat", "Mr. Hobby Flat Topcoat"],
  },
  {
    brand: "Mr. Hobby", name: "Mr. Super Clear Gloss", code: "B513",
    category: "TOPCOAT", finish: "Gloss", solventType: "Lacquer",
    aliases: ["Mr. Super Clear Gloss", "B513", "MSC Gloss"],
  },
  {
    brand: "Mr. Hobby", name: "Mr. Super Clear Semi-Gloss", code: "B516",
    category: "TOPCOAT", finish: "Semi-Gloss", solventType: "Lacquer",
    aliases: ["Mr. Super Clear Semi-Gloss", "B516", "MSC Semi-Gloss"],
  },
  // Thinner
  {
    brand: "Mr. Hobby", name: "Mr. Color Thinner", code: "T101",
    category: "THINNER", solventType: "Lacquer",
    aliases: ["Mr. Color Thinner", "T101", "Mr. Hobby Leveling Thinner", "Mr. Thinner"],
  },
  {
    brand: "Mr. Hobby", name: "Mr. Color Leveling Thinner", code: "T106",
    category: "THINNER", solventType: "Lacquer",
    aliases: ["Leveling Thinner", "T106", "Mr. Leveling Thinner"],
  },
];

// ─── Tamiya ──────────────────────────────────────────────────────

const tamiya: SupplyEntry[] = [
  // Panel Line Accent
  {
    brand: "Tamiya", productLine: "Panel Line Accent", name: "Panel Line Accent Color Black", code: "87131",
    category: "PANEL_LINER", solventType: "Enamel", colorHex: "#1a1a1a",
    aliases: ["Tamiya Panel Line Black", "Tamiya 87131", "PLAC Black", "Tamiya Black Panel Liner", "Tamiya panel line accent", "panel liner black", "tamiya panel liner black"],
  },
  {
    brand: "Tamiya", productLine: "Panel Line Accent", name: "Panel Line Accent Color Brown", code: "87132",
    category: "PANEL_LINER", solventType: "Enamel", colorHex: "#5c3317",
    aliases: ["Tamiya Panel Line Brown", "Tamiya 87132", "PLAC Brown", "panel liner brown", "tamiya panel liner brown"],
  },
  {
    brand: "Tamiya", productLine: "Panel Line Accent", name: "Panel Line Accent Color Gray", code: "87133",
    category: "PANEL_LINER", solventType: "Enamel", colorHex: "#808080",
    aliases: ["Tamiya Panel Line Gray", "Tamiya 87133", "PLAC Gray", "PLAC Grey", "panel liner gray", "panel liner grey", "tamiya panel liner gray"],
  },
  {
    brand: "Tamiya", productLine: "Panel Line Accent", name: "Panel Line Accent Color Dark Brown", code: "87140",
    category: "PANEL_LINER", solventType: "Enamel", colorHex: "#3b1e0a",
    aliases: ["Tamiya Panel Line Dark Brown", "Tamiya 87140", "panel liner dark brown", "tamiya panel liner dark brown"],
  },
  // Spray primers
  {
    brand: "Tamiya", name: "Surface Primer Gray", code: "87042",
    category: "PRIMER", colorHex: "#808080",
    aliases: ["Tamiya Primer Gray", "Tamiya 87042", "Tamiya Gray Primer", "Tamiya Surface Primer", "gray primer", "grey primer"],
  },
  {
    brand: "Tamiya", name: "Surface Primer White", code: "87044",
    category: "PRIMER", colorHex: "#f0f0f0",
    aliases: ["Tamiya Primer White", "Tamiya 87044", "Tamiya White Primer", "white primer"],
  },
  {
    brand: "Tamiya", name: "Fine Surface Primer L (Light Gray)", code: "87054",
    category: "PRIMER", colorHex: "#c0c0c0",
    aliases: ["Tamiya Fine Primer Light Gray", "Tamiya 87054"],
  },
  // Cement
  {
    brand: "Tamiya", name: "Tamiya Cement (Square Bottle)", code: "87003",
    category: "CEMENT",
    aliases: ["Tamiya Cement", "Tamiya 87003", "Tamiya Plastic Cement", "Tamiya Orange Cap"],
  },
  {
    brand: "Tamiya", name: "Tamiya Extra Thin Cement", code: "87038",
    category: "CEMENT",
    aliases: ["Tamiya Thin Cement", "Tamiya 87038", "Tamiya Extra Thin", "Tamiya Green Cap"],
  },
  {
    brand: "Tamiya", name: "Tamiya Extra Thin Cement Quick-Setting", code: "87182",
    category: "CEMENT",
    aliases: ["Tamiya Quick Setting Cement", "Tamiya 87182", "Tamiya Quick Thin Cement"],
  },
  // Masking tape
  {
    brand: "Tamiya", name: "Masking Tape 6mm", code: "87030",
    category: "MASKING",
    aliases: ["Tamiya Masking Tape 6mm", "Tamiya 87030"],
  },
  {
    brand: "Tamiya", name: "Masking Tape 10mm", code: "87031",
    category: "MASKING",
    aliases: ["Tamiya Masking Tape 10mm", "Tamiya 87031", "Tamiya Masking Tape"],
  },
  {
    brand: "Tamiya", name: "Masking Tape 18mm", code: "87032",
    category: "MASKING",
    aliases: ["Tamiya Masking Tape 18mm", "Tamiya 87032"],
  },
  // Weathering Master
  {
    brand: "Tamiya", productLine: "Weathering Master", name: "Weathering Master Set A", code: "87079",
    category: "PAINT", subcategory: "Weathering",
    aliases: ["Tamiya Weathering Master A", "Tamiya 87079", "Weathering Master A"],
  },
  // Enamel thinner
  {
    brand: "Tamiya", name: "Enamel Thinner X-20", code: "87114",
    category: "THINNER", solventType: "Enamel",
    aliases: ["Tamiya X-20", "Tamiya Enamel Thinner", "X-20", "Tamiya 87114"],
  },
  // Spray topcoat
  {
    brand: "Tamiya", name: "Top Coat Flat", code: "86520",
    category: "TOPCOAT", finish: "Flat",
    aliases: ["Tamiya Flat Top Coat", "Tamiya Flat Clear", "Tamiya 86520", "TS-80"],
  },
  {
    brand: "Tamiya", name: "Top Coat Gloss", code: "86501",
    category: "TOPCOAT", finish: "Gloss",
    aliases: ["Tamiya Gloss Top Coat", "Tamiya 86501", "TS-13"],
  },
];

// ─── Gaia Notes ──────────────────────────────────────────────────

const gaiaNotes: SupplyEntry[] = [
  {
    brand: "Gaia Notes", name: "Ultimate White", code: "001",
    category: "PAINT", finish: "Gloss", solventType: "Lacquer", colorHex: "#ffffff",
    aliases: ["Gaia Ultimate White", "Gaia 001", "Gaia Notes White"],
  },
  {
    brand: "Gaia Notes", name: "Pure Black", code: "002",
    category: "PAINT", finish: "Gloss", solventType: "Lacquer", colorHex: "#0a0a0a",
    aliases: ["Gaia Pure Black", "Gaia 002", "Gaia Notes Black"],
  },
  {
    brand: "Gaia Notes", name: "Bright Red", code: "003",
    category: "PAINT", finish: "Gloss", solventType: "Lacquer", colorHex: "#dd0000",
    aliases: ["Gaia Bright Red", "Gaia 003"],
  },
  {
    brand: "Gaia Notes", name: "Neutral Gray I", code: "071",
    category: "PAINT", finish: "Semi-Gloss", solventType: "Lacquer", colorHex: "#999999",
    aliases: ["Gaia Neutral Gray 1", "Gaia 071", "Gaia Gray I"],
  },
  {
    brand: "Gaia Notes", name: "Neutral Gray V", code: "075",
    category: "PAINT", finish: "Semi-Gloss", solventType: "Lacquer", colorHex: "#555555",
    aliases: ["Gaia Neutral Gray 5", "Gaia 075", "Gaia Gray V"],
  },
  {
    brand: "Gaia Notes", name: "Ex-Flat Clear", code: "Ex-03",
    category: "TOPCOAT", finish: "Flat", solventType: "Lacquer",
    aliases: ["Gaia Flat Clear", "Gaia Ex-03", "Gaia Flat Topcoat", "Ex Flat Clear"],
  },
  {
    brand: "Gaia Notes", name: "Ex-Gloss Clear", code: "Ex-01",
    category: "TOPCOAT", finish: "Gloss", solventType: "Lacquer",
    aliases: ["Gaia Gloss Clear", "Gaia Ex-01"],
  },
  {
    brand: "Gaia Notes", name: "Gaia Color Thinner", code: "T-01",
    category: "THINNER", solventType: "Lacquer",
    aliases: ["Gaia Thinner", "Gaia T-01", "Gaia Notes Thinner"],
  },
  {
    brand: "Gaia Notes", name: "Surfacer Evo", code: "SF-01",
    category: "PRIMER", solventType: "Lacquer",
    aliases: ["Gaia Surfacer Evo", "Gaia Primer", "Gaia SF-01"],
  },
  {
    brand: "Gaia Notes", name: "Star Bright Gold", code: "122",
    category: "PAINT", finish: "Metallic", solventType: "Lacquer", colorHex: "#d4a017",
    aliases: ["Gaia Star Bright Gold", "Gaia Gold", "Gaia 122"],
  },
];

// ─── Tools: DSPIAE + Godhand + common ────────────────────────────

const tools: SupplyEntry[] = [
  // Godhand
  {
    brand: "GodHand", name: "SPN-120 Ultimate Nipper", code: "SPN-120",
    category: "TOOL", subcategory: "Nippers",
    aliases: ["Godhand Nipper", "SPN-120", "SPN120", "Godhand Ultimate Nipper", "GodHand SPN-120", "godhand spn120", "Godhand nippers"],
  },
  {
    brand: "GodHand", name: "Kamiyasu Sanding Sponge #400", code: "GH-KS2-P400",
    category: "ABRASIVE", subcategory: "Sanding Sponge",
    aliases: ["Godhand Sanding Sponge 400", "Kamiyasu 400"],
  },
  {
    brand: "GodHand", name: "Kamiyasu Sanding Sponge #800", code: "GH-KS2-P800",
    category: "ABRASIVE", subcategory: "Sanding Sponge",
    aliases: ["Godhand Sanding Sponge 800", "Kamiyasu 800"],
  },
  // DSPIAE
  {
    brand: "DSPIAE", name: "Single Blade Nipper 3.0", code: "ST-A 3.0",
    category: "TOOL", subcategory: "Nippers",
    aliases: ["DSPIAE Nipper", "DSPIAE ST-A", "DSPIAE Single Blade Nipper", "ST-A 3.0"],
  },
  {
    brand: "DSPIAE", name: "Push Broach Chisel 0.15mm", code: "PB-01",
    category: "TOOL", subcategory: "Scribing",
    aliases: ["DSPIAE Chisel 0.15", "DSPIAE PB-01", "DSPIAE Push Broach"],
  },
  {
    brand: "DSPIAE", name: "Push Broach Chisel 0.2mm", code: "PB-02",
    category: "TOOL", subcategory: "Scribing",
    aliases: ["DSPIAE Chisel 0.2", "DSPIAE PB-02"],
  },
  {
    brand: "DSPIAE", name: "Tungsten Steel Line Engraver", code: "AT-THL",
    category: "TOOL", subcategory: "Scribing",
    aliases: ["DSPIAE Line Engraver", "DSPIAE AT-THL", "DSPIAE Scriber"],
  },
  {
    brand: "DSPIAE", name: "Glass File", code: "CF-10",
    category: "ABRASIVE", subcategory: "File",
    aliases: ["DSPIAE Glass File", "DSPIAE CF-10"],
  },
  // Gundam Marker
  {
    brand: "Mr. Hobby", productLine: "Gundam Marker", name: "Gundam Marker Black (Fine Tip)", code: "GM01",
    category: "MARKER",
    aliases: ["Gundam Marker Black", "GM01", "Gundam Marker Fine Black", "Mr. Hobby GM01"],
  },
  {
    brand: "Mr. Hobby", productLine: "Gundam Marker", name: "Gundam Marker Gray (Fine Tip)", code: "GM02",
    category: "MARKER",
    aliases: ["Gundam Marker Gray", "GM02", "Gundam Marker Fine Gray"],
  },
  {
    brand: "Mr. Hobby", productLine: "Gundam Marker", name: "Gundam Marker Brown (Fine Tip)", code: "GM03",
    category: "MARKER",
    aliases: ["Gundam Marker Brown", "GM03"],
  },
  // Generic common tools
  {
    brand: "Tamiya", name: "Design Knife", code: "74020",
    category: "TOOL", subcategory: "Knife",
    aliases: ["Tamiya Design Knife", "Tamiya 74020", "Tamiya Hobby Knife"],
  },
  {
    brand: "Tamiya", name: "Thin Blade Craft Saw", code: "74024",
    category: "TOOL", subcategory: "Saw",
    aliases: ["Tamiya Craft Saw", "Tamiya 74024"],
  },
  {
    brand: "Tamiya", name: "Basic File Set", code: "74046",
    category: "TOOL", subcategory: "File",
    aliases: ["Tamiya File Set", "Tamiya 74046", "Tamiya Files"],
  },
  // Mr. Hobby putty
  {
    brand: "Mr. Hobby", name: "Mr. White Putty", code: "P117",
    category: "PUTTY",
    aliases: ["Mr. White Putty", "P117", "Mr. Hobby Putty"],
  },
  {
    brand: "Tamiya", name: "Tamiya Basic Putty", code: "87053",
    category: "PUTTY",
    aliases: ["Tamiya Putty", "Tamiya 87053", "Tamiya White Putty"],
  },
];

// ─── Combined catalog ────────────────────────────────────────────

const ALL_SUPPLIES: SupplyEntry[] = [...mrHobby, ...tamiya, ...gaiaNotes, ...tools];

// ─── Seeder ──────────────────────────────────────────────────────

export async function seedSupplies() {
  console.log(`Seeding ${ALL_SUPPLIES.length} supplies...`);

  let created = 0;
  let skipped = 0;

  for (const entry of ALL_SUPPLIES) {
    const slug = slugify(entry.brand, entry.name, entry.code);

    // Skip if already exists
    const existing = await prisma.supply.findUnique({ where: { slug } });
    if (existing) {
      skipped++;
      continue;
    }

    // Derive searchName: strip brand prefix from name
    let searchName = entry.name;
    if (searchName.toLowerCase().startsWith(entry.brand.toLowerCase())) {
      searchName = searchName.slice(entry.brand.length).trim();
    }

    await prisma.supply.create({
      data: {
        brand: entry.brand,
        productLine: entry.productLine || null,
        name: entry.name,
        code: entry.code || null,
        category: entry.category,
        subcategory: entry.subcategory || null,
        finish: entry.finish || null,
        solventType: entry.solventType || null,
        colorHex: entry.colorHex || null,
        searchName,
        slug,
        aliases: {
          create: entry.aliases.map((alias) => ({ alias })),
        },
      },
    });
    created++;
  }

  console.log(`Supplies seeded: ${created} created, ${skipped} already existed.`);
}

// Allow direct execution
if (require.main === module) {
  seedSupplies()
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e);
      prisma.$disconnect();
      process.exit(1);
    });
}
