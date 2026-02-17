import { mechSilhouettes, type MechSilhouette } from "../assets/silhouettes";

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function renderSilhouetteSvg(
  silhouette: MechSilhouette,
  opts: { fill?: string; stroke?: string; opacity?: number; size?: number } = {}
): string {
  const { fill = "#dc2626", stroke = "none", opacity = 1, size = 120 } = opts;
  const [, , vbW, vbH] = silhouette.viewBox.split(" ");
  const aspectRatio = Number(vbW) / Number(vbH);
  const width = Math.round(size * aspectRatio);
  const height = size;

  const pathElements = silhouette.paths
    .map(
      (d) =>
        `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="1" opacity="${opacity}" />`
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${silhouette.viewBox}" width="${width}" height="${height}">${pathElements}</svg>`;
}

export interface SilhouetteChallengeResult {
  promptSvg: string;
  options: { id: string; svg: string }[];
  correctId: string;
}

/**
 * "Select the matching silhouette" challenge.
 * Picks a target silhouette, renders it as the prompt (filled solid),
 * and generates 4-6 options (1 correct + rest wrong) as outline SVGs.
 */
export function generateSilhouetteChallenge(): SilhouetteChallengeResult {
  const shuffled = shuffleArray(mechSilhouettes);
  const target = shuffled[0];

  // Prompt: solid white fill, no identifying details
  const promptSvg = renderSilhouetteSvg(target, {
    fill: "#e2e2e2",
    stroke: "#555555",
    opacity: 0.9,
    size: 160,
  });

  // Pick 3-5 wrong options (random count between 3 and 5)
  const wrongCount = 3 + Math.floor(Math.random() * 3); // 3, 4, or 5
  const wrongSilhouettes = shuffled.slice(1, 1 + wrongCount);

  // Build all options (correct + wrong)
  const allOptions = [
    {
      id: target.id,
      svg: renderSilhouetteSvg(target, {
        fill: "#a0a0a0",
        stroke: "#666666",
        size: 100,
      }),
    },
    ...wrongSilhouettes.map((s) => ({
      id: s.id,
      svg: renderSilhouetteSvg(s, {
        fill: "#a0a0a0",
        stroke: "#666666",
        size: 100,
      }),
    })),
  ];

  return {
    promptSvg,
    options: shuffleArray(allOptions),
    correctId: target.id,
  };
}
