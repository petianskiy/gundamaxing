export interface MechSilhouette {
  id: string;
  name: string;
  paths: string[];
  viewBox: string;
}

/**
 * Original generic mech silhouettes — NOT based on any copyrighted designs.
 * Each silhouette is an abstract humanoid mecha outline defined as SVG path data.
 */
export const mechSilhouettes: MechSilhouette[] = [
  {
    id: "heavy-assault",
    name: "Heavy Assault",
    viewBox: "0 0 100 120",
    paths: [
      // Torso — wide, boxy upper body
      "M35 35 L40 25 L60 25 L65 35 L68 50 L62 55 L38 55 L32 50 Z",
      // Head — angular helmet shape
      "M44 25 L46 15 L50 12 L54 15 L56 25 Z",
      // Head crest
      "M48 12 L50 6 L52 12 Z",
      // Left arm — thick armored limb
      "M32 37 L24 38 L18 50 L16 65 L22 67 L28 55 L32 50 Z",
      // Right arm — thick armored limb
      "M68 37 L76 38 L82 50 L84 65 L78 67 L72 55 L68 50 Z",
      // Left shoulder pad
      "M28 30 L22 28 L18 35 L26 40 L35 37 Z",
      // Right shoulder pad
      "M72 30 L78 28 L82 35 L74 40 L65 37 Z",
      // Waist
      "M38 55 L40 62 L60 62 L62 55 Z",
      // Left leg — heavy plating
      "M40 62 L36 75 L34 95 L32 108 L40 110 L44 95 L46 75 L48 62 Z",
      // Right leg — heavy plating
      "M52 62 L54 75 L56 95 L60 108 L68 110 L66 95 L64 75 L60 62 Z",
      // Left foot
      "M30 108 L28 116 L44 116 L42 110 Z",
      // Right foot
      "M58 108 L56 116 L72 116 L70 110 Z",
    ],
  },
  {
    id: "recon-unit",
    name: "Recon Unit",
    viewBox: "0 0 100 120",
    paths: [
      // Torso — slim, streamlined
      "M40 32 L43 24 L57 24 L60 32 L62 48 L58 52 L42 52 L38 48 Z",
      // Head — visor-style
      "M45 24 L47 16 L53 16 L55 24 Z",
      // Visor
      "M46 18 L54 18 L53 21 L47 21 Z",
      // Antenna left
      "M45 16 L38 8 L40 7 L47 15 Z",
      // Antenna right
      "M55 16 L62 8 L60 7 L53 15 Z",
      // Left arm — thin, agile
      "M38 34 L30 36 L24 48 L22 62 L26 63 L30 50 L36 40 Z",
      // Right arm — thin, agile
      "M62 34 L70 36 L76 48 L78 62 L74 63 L70 50 L64 40 Z",
      // Waist
      "M42 52 L44 58 L56 58 L58 52 Z",
      // Left leg — slender
      "M44 58 L42 72 L40 90 L38 106 L44 108 L46 90 L47 72 L48 58 Z",
      // Right leg — slender
      "M52 58 L53 72 L54 90 L56 106 L62 108 L60 90 L58 72 L56 58 Z",
      // Left foot
      "M36 106 L34 114 L46 114 L45 108 Z",
      // Right foot
      "M55 106 L54 114 L66 114 L64 108 Z",
    ],
  },
  {
    id: "artillery-frame",
    name: "Artillery Frame",
    viewBox: "0 0 100 120",
    paths: [
      // Torso — angled, wide chest
      "M33 38 L38 26 L62 26 L67 38 L70 52 L64 56 L36 56 L30 52 Z",
      // Head — compact
      "M44 26 L46 18 L54 18 L56 26 Z",
      // Head sensor
      "M48 18 L50 14 L52 18 Z",
      // Left arm — cannon mount
      "M30 40 L20 42 L10 48 L4 52 L4 56 L10 54 L20 50 L30 48 Z",
      // Cannon barrel
      "M4 52 L-8 50 L-8 54 L4 56 Z",
      // Right arm — standard
      "M70 40 L78 42 L84 52 L86 66 L80 68 L76 56 L70 48 Z",
      // Right shoulder guard
      "M68 30 L76 28 L80 36 L74 42 L67 38 Z",
      // Left shoulder mount
      "M32 30 L22 26 L16 34 L24 42 L33 38 Z",
      // Waist
      "M36 56 L40 64 L60 64 L64 56 Z",
      // Left leg — stabilizer
      "M40 64 L36 78 L32 96 L30 110 L38 112 L42 96 L44 78 L46 64 Z",
      // Right leg — stabilizer
      "M54 64 L56 78 L58 96 L62 110 L70 112 L68 96 L64 78 L60 64 Z",
      // Left foot — wide base
      "M26 110 L24 118 L42 118 L40 112 Z",
      // Right foot — wide base
      "M60 110 L58 118 L74 118 L72 112 Z",
    ],
  },
  {
    id: "sniper-class",
    name: "Sniper Class",
    viewBox: "0 0 100 120",
    paths: [
      // Torso — narrow, tall
      "M40 34 L43 22 L57 22 L60 34 L62 50 L58 54 L42 54 L38 50 Z",
      // Head — angular with scope
      "M45 22 L47 14 L53 14 L55 22 Z",
      // Scope on head
      "M55 16 L64 14 L64 18 L55 19 Z",
      // Left arm — holding rifle support
      "M38 36 L30 38 L26 46 L24 52 L28 54 L32 48 L36 42 Z",
      // Right arm — extended forward
      "M62 36 L70 38 L78 42 L86 44 L86 48 L78 48 L70 46 L62 42 Z",
      // Sniper rifle
      "M86 44 L104 40 L104 44 L86 48 Z",
      // Waist — thin
      "M42 54 L44 60 L56 60 L58 54 Z",
      // Left leg
      "M44 60 L42 74 L40 92 L38 108 L44 110 L46 92 L47 74 L48 60 Z",
      // Right leg — kneeling stance
      "M52 60 L54 74 L56 86 L62 92 L64 104 L58 108 L54 98 L52 86 L52 74 L54 60 Z",
      // Left foot
      "M36 108 L34 116 L46 116 L45 110 Z",
      // Right foot
      "M56 104 L56 112 L68 112 L66 108 Z",
    ],
  },
  {
    id: "commander-type",
    name: "Commander Type",
    viewBox: "0 0 100 120",
    paths: [
      // Torso — regal, V-fin prominent
      "M36 36 L40 26 L60 26 L64 36 L66 50 L62 54 L38 54 L34 50 Z",
      // Head
      "M44 26 L46 17 L54 17 L56 26 Z",
      // V-fin left
      "M46 17 L36 6 L38 4 L48 15 Z",
      // V-fin right
      "M54 17 L64 6 L62 4 L52 15 Z",
      // Chest emblem
      "M46 34 L50 30 L54 34 L50 38 Z",
      // Left arm
      "M34 38 L26 40 L20 50 L18 64 L24 66 L28 52 L32 44 Z",
      // Right arm
      "M66 38 L74 40 L80 50 L82 64 L76 66 L72 52 L68 44 Z",
      // Left shoulder
      "M30 30 L24 28 L20 34 L26 40 L36 36 Z",
      // Right shoulder
      "M70 30 L76 28 L80 34 L74 40 L64 36 Z",
      // Cape / wing (left)
      "M34 38 L20 42 L14 60 L18 80 L26 70 L30 54 Z",
      // Cape / wing (right)
      "M66 38 L80 42 L86 60 L82 80 L74 70 L70 54 Z",
      // Waist
      "M38 54 L42 62 L58 62 L62 54 Z",
      // Skirt armor
      "M38 54 L34 68 L42 68 L44 60 Z",
      "M62 54 L66 68 L58 68 L56 60 Z",
      // Left leg
      "M42 62 L40 76 L38 94 L36 108 L42 110 L44 94 L45 76 L46 62 Z",
      // Right leg
      "M54 62 L55 76 L56 94 L58 108 L64 110 L62 94 L60 76 L58 62 Z",
      // Left foot
      "M34 108 L32 116 L44 116 L43 110 Z",
      // Right foot
      "M57 108 L56 116 L68 116 L66 110 Z",
    ],
  },
  {
    id: "shield-defender",
    name: "Shield Defender",
    viewBox: "0 0 100 120",
    paths: [
      // Torso — broad
      "M34 36 L38 26 L62 26 L66 36 L68 50 L64 54 L36 54 L32 50 Z",
      // Head — fortified
      "M44 26 L45 18 L55 18 L56 26 Z",
      // Head guard plates
      "M42 22 L40 18 L44 16 L46 20 Z",
      "M58 22 L60 18 L56 16 L54 20 Z",
      // Left arm — shield arm
      "M32 38 L24 40 L18 48 L14 60 L12 70 L18 72 L22 62 L26 50 L30 44 Z",
      // Shield
      "M6 44 L2 50 L2 76 L6 82 L18 82 L22 76 L22 50 L18 44 Z",
      // Right arm
      "M68 38 L76 40 L82 50 L84 64 L78 66 L74 52 L70 44 Z",
      // Left shoulder — extra armor
      "M28 28 L18 26 L14 36 L22 44 L34 38 Z",
      // Right shoulder
      "M72 28 L78 26 L82 34 L76 42 L66 36 Z",
      // Waist
      "M36 54 L40 62 L60 62 L64 54 Z",
      // Left leg — reinforced
      "M40 62 L36 76 L34 94 L32 108 L40 112 L44 94 L45 76 L46 62 Z",
      // Right leg — reinforced
      "M54 62 L55 76 L56 94 L60 108 L68 112 L66 94 L64 76 L60 62 Z",
      // Left foot
      "M30 108 L28 116 L42 116 L41 112 Z",
      // Right foot
      "M59 108 L58 116 L70 116 L69 112 Z",
    ],
  },
  {
    id: "flight-interceptor",
    name: "Flight Interceptor",
    viewBox: "0 0 100 120",
    paths: [
      // Torso — aerodynamic
      "M38 34 L42 24 L58 24 L62 34 L64 48 L60 52 L40 52 L36 48 Z",
      // Head — streamlined
      "M45 24 L47 15 L53 15 L55 24 Z",
      // Head fin
      "M49 15 L50 8 L51 15 Z",
      // Left arm — wing-bladed
      "M36 36 L28 38 L22 46 L20 58 L24 60 L28 50 L34 42 Z",
      // Right arm — wing-bladed
      "M64 36 L72 38 L78 46 L80 58 L76 60 L72 50 L66 42 Z",
      // Left wing
      "M36 40 L18 34 L6 38 L4 44 L16 42 L34 44 Z",
      // Right wing
      "M64 40 L82 34 L94 38 L96 44 L84 42 L66 44 Z",
      // Wing tip thrusters (left)
      "M4 44 L2 48 L8 48 L6 44 Z",
      // Wing tip thrusters (right)
      "M94 44 L92 48 L98 48 L96 44 Z",
      // Waist — slim
      "M40 52 L43 58 L57 58 L60 52 Z",
      // Left leg — thruster-equipped
      "M43 58 L41 72 L39 88 L37 104 L43 106 L45 88 L46 72 L47 58 Z",
      // Right leg — thruster-equipped
      "M53 58 L54 72 L55 88 L57 104 L63 106 L61 88 L59 72 L57 58 Z",
      // Back thrusters
      "M42 48 L40 58 L44 62 L48 58 L46 48 Z",
      "M54 48 L52 58 L56 62 L60 58 L58 48 Z",
      // Left foot
      "M35 104 L33 112 L45 112 L44 106 Z",
      // Right foot
      "M56 104 L55 112 L65 112 L64 106 Z",
    ],
  },
  {
    id: "melee-striker",
    name: "Melee Striker",
    viewBox: "0 0 100 120",
    paths: [
      // Torso — athletic build
      "M37 35 L41 25 L59 25 L63 35 L65 48 L61 53 L39 53 L35 48 Z",
      // Head — aggressive style
      "M45 25 L47 16 L53 16 L55 25 Z",
      // Horn left
      "M47 16 L42 10 L44 8 L48 14 Z",
      // Horn right
      "M53 16 L58 10 L56 8 L52 14 Z",
      // Left arm — extended with blade
      "M35 37 L26 38 L18 44 L12 54 L8 60 L12 62 L18 56 L26 48 L33 42 Z",
      // Left blade
      "M8 60 L-4 56 L-6 60 L8 64 Z",
      // Right arm
      "M65 37 L74 38 L80 48 L82 62 L76 64 L72 52 L68 42 Z",
      // Right forearm guard
      "M76 48 L82 46 L86 52 L84 58 L78 56 Z",
      // Waist
      "M39 53 L42 60 L58 60 L61 53 Z",
      // Left leg — dynamic stance
      "M42 60 L38 74 L34 90 L32 106 L38 108 L42 92 L44 76 L46 60 Z",
      // Right leg — forward step
      "M54 60 L56 72 L60 84 L64 98 L68 108 L74 106 L68 94 L62 80 L58 68 L56 60 Z",
      // Left foot
      "M30 106 L28 114 L40 114 L39 108 Z",
      // Right foot
      "M66 106 L64 114 L76 114 L76 108 Z",
    ],
  },
  {
    id: "support-medic",
    name: "Support Medic",
    viewBox: "0 0 100 120",
    paths: [
      // Torso — rounded, non-threatening
      "M38 34 L42 26 L58 26 L62 34 L64 48 L60 54 L40 54 L36 48 Z",
      // Head — dome style
      "M44 26 L44 18 Q50 12 56 18 L56 26 Z",
      // Visor band
      "M44 20 L56 20 L56 23 L44 23 Z",
      // Left arm — medical tool
      "M36 36 L28 38 L22 46 L20 58 L24 60 L28 50 L34 42 Z",
      // Left hand tool
      "M18 58 L14 56 L12 62 L16 64 L22 62 Z",
      // Right arm — manipulator
      "M64 36 L72 38 L78 46 L80 58 L76 60 L72 50 L66 42 Z",
      // Backpack — medical supply
      "M40 30 L38 34 L38 48 L42 52 L58 52 L62 48 L62 34 L60 30 Z",
      // Cross emblem on backpack
      "M48 38 L52 38 L52 34 L48 34 Z",
      "M46 40 L54 40 L54 36 L46 36 Z",
      // Waist
      "M40 54 L43 60 L57 60 L60 54 Z",
      // Left leg
      "M43 60 L41 74 L39 90 L37 106 L43 108 L45 90 L46 74 L47 60 Z",
      // Right leg
      "M53 60 L54 74 L55 90 L57 106 L63 108 L61 90 L59 74 L57 60 Z",
      // Left foot
      "M35 106 L33 114 L45 114 L44 108 Z",
      // Right foot
      "M56 106 L55 114 L65 114 L64 108 Z",
    ],
  },
  {
    id: "siege-breaker",
    name: "Siege Breaker",
    viewBox: "0 0 100 120",
    paths: [
      // Torso — massive, reinforced
      "M30 38 L36 26 L64 26 L70 38 L72 54 L66 58 L34 58 L28 54 Z",
      // Head — small relative to body
      "M44 26 L46 20 L54 20 L56 26 Z",
      // Head plate
      "M44 22 L42 18 L50 14 L58 18 L56 22 Z",
      // Left arm — massive pile driver
      "M28 40 L18 42 L10 52 L6 66 L4 78 L10 80 L14 68 L18 56 L24 46 Z",
      // Pile driver mechanism
      "M4 74 L-2 72 L-4 80 L2 82 L10 80 Z",
      // Right arm — grappler
      "M72 40 L82 42 L88 52 L92 64 L88 68 L84 56 L78 46 Z",
      // Grappler claw
      "M90 62 L96 58 L98 64 L94 68 Z",
      "M90 64 L96 68 L98 74 L92 70 Z",
      // Massive shoulder left
      "M24 28 L14 24 L8 36 L18 46 L30 40 Z",
      // Massive shoulder right
      "M76 28 L86 24 L92 36 L82 46 L70 40 Z",
      // Waist — reinforced
      "M34 58 L38 66 L62 66 L66 58 Z",
      // Front skirt armor
      "M38 58 L36 70 L44 70 L46 62 Z",
      "M54 62 L56 70 L64 70 L62 58 Z",
      // Left leg — pillar-like
      "M38 66 L34 80 L30 98 L28 110 L38 114 L42 98 L44 80 L46 66 Z",
      // Right leg — pillar-like
      "M54 66 L56 80 L58 98 L62 110 L72 114 L70 98 L66 80 L62 66 Z",
      // Left foot — wide
      "M24 110 L22 118 L42 118 L40 114 Z",
      // Right foot — wide
      "M60 110 L58 118 L76 118 L74 114 Z",
    ],
  },
];
