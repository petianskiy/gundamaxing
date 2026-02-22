export { FaultyTerminal } from "./faulty-terminal";
export { Grainient } from "./grainient";
export { WarSmoke } from "./war-smoke";

export const WEBGL_PRESETS = [
  "preset:faulty-terminal",
  "preset:grainient",
  "preset:war-smoke",
] as const;

/** Presets that store config in backgroundConfig (WebGL + configurable CSS) */
export const CONFIGURABLE_PRESETS = [
  ...WEBGL_PRESETS,
  "preset:gradient",
] as const;

export type WebGLPresetKey = (typeof WEBGL_PRESETS)[number];
export type ConfigurablePresetKey = (typeof CONFIGURABLE_PRESETS)[number];

export function isWebGLPreset(key: string): key is WebGLPresetKey {
  return (WEBGL_PRESETS as readonly string[]).includes(key);
}

export function isConfigurablePreset(key: string): key is ConfigurablePresetKey {
  return (CONFIGURABLE_PRESETS as readonly string[]).includes(key);
}
