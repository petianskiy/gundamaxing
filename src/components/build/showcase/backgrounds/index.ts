export { Grainient } from "./grainient";

export const WEBGL_PRESETS = [
  "preset:grainient",
] as const;

export type WebGLPresetKey = (typeof WEBGL_PRESETS)[number];

export function isWebGLPreset(key: string): key is WebGLPresetKey {
  return (WEBGL_PRESETS as readonly string[]).includes(key);
}
