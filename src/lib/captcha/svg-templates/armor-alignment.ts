import { mechSilhouettes } from "../assets/silhouettes";

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Render a mech part (first 2-3 paths from a silhouette) at a given rotation.
 */
function renderRotatedPartSvg(
  paths: string[],
  viewBox: string,
  rotation: number,
  opts: { fill?: string; stroke?: string; size?: number } = {}
): string {
  const { fill = "#a0a0a0", stroke = "#666666", size = 100 } = opts;
  const [vbX, vbY, vbW, vbH] = viewBox.split(" ").map(Number);
  const cx = vbX + vbW / 2;
  const cy = vbY + vbH / 2;
  const aspectRatio = vbW / vbH;
  const width = Math.round(size * aspectRatio);
  const height = size;

  const pathElements = paths
    .map(
      (d) =>
        `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="1" />`
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}"><g transform="rotate(${rotation} ${cx} ${cy})">${pathElements}</g></svg>`;
}

export interface ArmorAlignmentChallengeResult {
  promptSvg: string;
  options: { id: string; svg: string }[];
  correctId: string;
}

/**
 * "Which rotation is correct?" challenge.
 * Shows a mech part at a specific angle as the prompt,
 * then generates 4 options with different rotations (only 1 matches).
 */
export function generateArmorAlignmentChallenge(): ArmorAlignmentChallengeResult {
  const shuffled = shuffleArray(mechSilhouettes);
  const target = shuffled[0];

  // Extract a subset of paths (torso + head area, typically first 2-4 paths)
  const partPaths = target.paths.slice(0, Math.min(4, target.paths.length));

  // The correct rotation is 0 degrees (upright)
  const correctRotation = 0;

  // Generate wrong rotations that are noticeably different
  const wrongRotations = shuffleArray([45, 90, 135, 180, -45, -90, -135]).slice(0, 3);

  // Prompt: show the correct orientation, highlighted
  const promptSvg = renderRotatedPartSvg(partPaths, target.viewBox, correctRotation, {
    fill: "#e2e2e2",
    stroke: "#555555",
    size: 160,
  });

  // Build option IDs encoding the rotation
  const correctId = `rot-${correctRotation}`;

  const allOptions = [
    {
      id: correctId,
      svg: renderRotatedPartSvg(partPaths, target.viewBox, correctRotation, {
        fill: "#a0a0a0",
        stroke: "#666666",
        size: 100,
      }),
    },
    ...wrongRotations.map((rot) => ({
      id: `rot-${rot}`,
      svg: renderRotatedPartSvg(partPaths, target.viewBox, rot, {
        fill: "#a0a0a0",
        stroke: "#666666",
        size: 100,
      }),
    })),
  ];

  return {
    promptSvg,
    options: shuffleArray(allOptions),
    correctId,
  };
}
