function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ---- Mech type definitions with associated correct loadout ----

interface MechType {
  id: string;
  name: string;
  description: string;
  correctLoadout: string;
  svgPaths: string[];
  viewBox: string;
}

interface WeaponLoadout {
  id: string;
  name: string;
  svgPaths: string[];
  viewBox: string;
}

/**
 * Original generic mech types paired with their logical weapon loadout.
 */
const mechTypes: MechType[] = [
  {
    id: "assault",
    name: "Assault Unit",
    description: "A heavily armored front-line combat unit",
    correctLoadout: "gatling-cannon",
    viewBox: "0 0 80 100",
    svgPaths: [
      // Boxy torso
      "M25 30 L30 20 L50 20 L55 30 L58 48 L52 52 L28 52 L22 48 Z",
      // Head
      "M35 20 L37 12 L43 12 L45 20 Z",
      // Wide shoulders
      "M18 24 L12 22 L10 30 L20 36 L25 30 Z",
      "M62 24 L68 22 L70 30 L60 36 L55 30 Z",
      // Thick legs
      "M30 52 L28 68 L26 86 L34 88 L36 68 L38 52 Z",
      "M42 52 L44 68 L46 86 L54 88 L52 68 L50 52 Z",
    ],
  },
  {
    id: "sniper",
    name: "Sniper Unit",
    description: "A precision long-range engagement unit",
    correctLoadout: "beam-rifle",
    viewBox: "0 0 80 100",
    svgPaths: [
      // Slim torso
      "M30 32 L34 22 L46 22 L50 32 L52 46 L48 50 L32 50 L28 46 Z",
      // Head with scope
      "M36 22 L38 14 L42 14 L44 22 Z",
      "M44 16 L52 14 L52 18 L44 19 Z",
      // Thin arms
      "M28 34 L22 36 L18 44 L22 46 L26 40 Z",
      "M52 34 L58 36 L62 44 L58 46 L54 40 Z",
      // Slender legs
      "M34 50 L32 66 L30 84 L36 86 L38 66 L39 50 Z",
      "M41 50 L42 66 L44 84 L50 86 L48 66 L46 50 Z",
    ],
  },
  {
    id: "support",
    name: "Support Unit",
    description: "A field support and repair unit",
    correctLoadout: "repair-module",
    viewBox: "0 0 80 100",
    svgPaths: [
      // Rounded torso
      "M28 34 L32 24 L48 24 L52 34 L54 46 L50 52 L30 52 L26 46 Z",
      // Dome head
      "M34 24 L34 16 Q40 10 46 16 L46 24 Z",
      // Tool arms
      "M26 36 L18 38 L14 46 L18 50 L24 44 Z",
      "M54 36 L62 38 L66 46 L62 50 L56 44 Z",
      // Backpack
      "M32 28 L28 32 L28 46 L32 50 L48 50 L52 46 L52 32 L48 28 Z",
      // Legs
      "M32 52 L30 68 L28 84 L34 86 L36 68 L38 52 Z",
      "M42 52 L44 68 L46 84 L52 86 L50 68 L48 52 Z",
    ],
  },
  {
    id: "aerial",
    name: "Aerial Unit",
    description: "A high-speed airborne combat unit",
    correctLoadout: "missile-pod",
    viewBox: "0 0 80 100",
    svgPaths: [
      // Streamlined torso
      "M30 30 L35 22 L45 22 L50 30 L52 44 L48 48 L32 48 L28 44 Z",
      // Sleek head
      "M36 22 L38 14 L42 14 L44 22 Z",
      // Wings
      "M28 36 L10 30 L6 36 L8 40 L26 40 Z",
      "M52 36 L70 30 L74 36 L72 40 L54 40 Z",
      // Thrusters
      "M34 44 L32 52 L36 56 L40 52 L38 44 Z",
      "M42 44 L40 52 L44 56 L48 52 L46 44 Z",
      // Legs (shorter)
      "M34 48 L32 62 L30 76 L36 78 L38 62 L39 48 Z",
      "M41 48 L42 62 L44 76 L50 78 L48 62 L46 48 Z",
    ],
  },
];

/**
 * Original weapon/loadout SVG icons.
 */
const weaponLoadouts: WeaponLoadout[] = [
  {
    id: "gatling-cannon",
    name: "Gatling Cannon",
    viewBox: "0 0 80 50",
    svgPaths: [
      // Main barrel housing
      "M10 18 L60 14 L64 18 L64 32 L60 36 L10 32 Z",
      // Individual barrels
      "M60 16 L78 15 L78 17 L60 18 Z",
      "M60 20 L78 20 L78 22 L60 22 Z",
      "M60 28 L78 28 L78 30 L60 30 Z",
      "M60 32 L78 33 L78 35 L60 34 Z",
      // Handle / grip
      "M20 32 L18 44 L24 46 L26 34 Z",
      // Ammo feed
      "M10 20 L4 22 L4 34 L10 32 Z",
    ],
  },
  {
    id: "beam-rifle",
    name: "Beam Rifle",
    viewBox: "0 0 80 50",
    svgPaths: [
      // Long barrel
      "M8 20 L68 18 L72 20 L72 26 L68 28 L8 28 Z",
      // Scope
      "M30 14 L32 14 L34 18 L30 18 Z",
      "M30 12 L34 12 L34 14 L30 14 Z",
      // Grip
      "M24 28 L22 40 L28 42 L30 30 Z",
      // Stock
      "M8 20 L2 22 L2 28 L8 28 Z",
      // Energy cell
      "M40 28 L38 34 L46 34 L44 28 Z",
      // Muzzle
      "M72 19 L80 18 L80 28 L72 27 Z",
    ],
  },
  {
    id: "repair-module",
    name: "Repair Module",
    viewBox: "0 0 80 50",
    svgPaths: [
      // Module body
      "M15 10 L65 10 L68 14 L68 36 L65 40 L15 40 L12 36 L12 14 Z",
      // Cross symbol
      "M36 16 L44 16 L44 20 L50 20 L50 28 L44 28 L44 34 L36 34 L36 28 L30 28 L30 20 L36 20 Z",
      // Mounting arm left
      "M12 22 L4 20 L2 24 L4 28 L12 26 Z",
      // Mounting arm right
      "M68 22 L76 20 L78 24 L76 28 L68 26 Z",
      // Status lights
      "M18 14 L22 14 L22 18 L18 18 Z",
      "M58 14 L62 14 L62 18 L58 18 Z",
    ],
  },
  {
    id: "missile-pod",
    name: "Missile Pod",
    viewBox: "0 0 80 50",
    svgPaths: [
      // Pod housing
      "M10 8 L70 8 L74 12 L74 38 L70 42 L10 42 L6 38 L6 12 Z",
      // Missile tubes (grid)
      "M14 12 L22 12 L22 20 L14 20 Z",
      "M26 12 L34 12 L34 20 L26 20 Z",
      "M38 12 L46 12 L46 20 L38 20 Z",
      "M50 12 L58 12 L58 20 L50 20 Z",
      "M14 24 L22 24 L22 32 L14 32 Z",
      "M26 24 L34 24 L34 32 L26 32 Z",
      "M38 24 L46 24 L46 32 L38 32 Z",
      "M50 24 L58 24 L58 32 L50 32 Z",
      // Mounting bracket
      "M34 42 L32 48 L48 48 L46 42 Z",
    ],
  },
  {
    id: "heat-saber",
    name: "Heat Saber",
    viewBox: "0 0 80 50",
    svgPaths: [
      // Blade
      "M30 6 L34 4 L76 20 L78 24 L36 10 L30 8 Z",
      // Blade edge glow
      "M34 8 L76 22 L76 26 L34 12 Z",
      // Guard
      "M26 14 L34 10 L36 16 L28 20 Z",
      // Handle
      "M18 20 L28 16 L30 22 L20 26 Z",
      // Pommel
      "M14 24 L20 22 L22 26 L16 30 L12 28 Z",
    ],
  },
  {
    id: "shield-generator",
    name: "Shield Generator",
    viewBox: "0 0 80 50",
    svgPaths: [
      // Generator core
      "M25 8 L55 8 L60 14 L60 36 L55 42 L25 42 L20 36 L20 14 Z",
      // Energy ring
      "M30 14 L50 14 L54 18 L54 32 L50 36 L30 36 L26 32 L26 18 Z",
      // Core dot
      "M37 22 L43 22 L43 28 L37 28 Z",
      // Left emitter
      "M20 20 L12 18 L8 22 L8 28 L12 32 L20 30 Z",
      // Right emitter
      "M60 20 L68 18 L72 22 L72 28 L68 32 L60 30 Z",
      // Power conduits
      "M25 42 L22 48 L28 48 Z",
      "M55 42 L52 48 L58 48 Z",
    ],
  },
];

function renderMechSvg(mech: MechType, size: number = 140): string {
  const [, , vbW, vbH] = mech.viewBox.split(" ").map(Number);
  const aspectRatio = vbW / vbH;
  const width = Math.round(size * aspectRatio);
  const height = size;

  const pathElements = mech.svgPaths
    .map((d) => `<path d="${d}" fill="#e2e2e2" stroke="#555555" stroke-width="0.8" />`)
    .join("");

  // Add a label underneath
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${mech.viewBox}" width="${width}" height="${height}">${pathElements}</svg>`;
}

function renderWeaponSvg(weapon: WeaponLoadout, size: number = 100): string {
  const [, , vbW, vbH] = weapon.viewBox.split(" ").map(Number);
  const aspectRatio = vbW / vbH;
  const width = Math.round(size * aspectRatio);
  const height = size;

  const pathElements = weapon.svgPaths
    .map((d) => `<path d="${d}" fill="#a0a0a0" stroke="#666666" stroke-width="0.8" />`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${weapon.viewBox}" width="${width}" height="${height}">${pathElements}</svg>`;
}

export interface LoadoutMatchChallengeResult {
  promptSvg: string;
  options: { id: string; svg: string }[];
  correctId: string;
}

/**
 * "Which weapon matches this suit?" challenge.
 * Shows a mech type, asks which loadout/weapon matches it.
 * Generates 4 weapon options (1 correct, 3 wrong).
 */
export function generateLoadoutMatchChallenge(): LoadoutMatchChallengeResult {
  const shuffledMechs = shuffleArray(mechTypes);
  const targetMech = shuffledMechs[0];

  // Prompt: the mech
  const promptSvg = renderMechSvg(targetMech, 160);

  const correctWeapon = weaponLoadouts.find(
    (w) => w.id === targetMech.correctLoadout
  )!;

  // Pick 3 wrong weapons
  const wrongWeapons = shuffleArray(
    weaponLoadouts.filter((w) => w.id !== targetMech.correctLoadout)
  ).slice(0, 3);

  const allOptions = [
    { id: correctWeapon.id, svg: renderWeaponSvg(correctWeapon) },
    ...wrongWeapons.map((w) => ({ id: w.id, svg: renderWeaponSvg(w) })),
  ];

  return {
    promptSvg,
    options: shuffleArray(allOptions),
    correctId: correctWeapon.id,
  };
}
