/**
 * Sample the color at (x, y) from a composited canvas.
 * Returns the hex color string (e.g. "#ff0000").
 */
export function sampleColor(canvas: HTMLCanvasElement, x: number, y: number): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return '#000000';

  // Round coordinates to integers and clamp to canvas bounds
  const px = Math.max(0, Math.min(Math.floor(x), canvas.width - 1));
  const py = Math.max(0, Math.min(Math.floor(y), canvas.height - 1));

  // Get pixel data
  const imageData = ctx.getImageData(px, py, 1, 1);
  const data = imageData.data;

  const r = data[0];
  const g = data[1];
  const b = data[2];

  // Convert RGB to hex
  const toHex = (n: number): string => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
