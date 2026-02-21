export { FaultyTerminal } from "./faulty-terminal";
export { Grainient } from "./grainient";

export const WEBGL_PRESETS = [
  "preset:faulty-terminal",
  "preset:grainient",
] as const;

export type WebGLPresetKey = (typeof WEBGL_PRESETS)[number];

export function isWebGLPreset(key: string): key is WebGLPresetKey {
  return (WEBGL_PRESETS as readonly string[]).includes(key);
}
