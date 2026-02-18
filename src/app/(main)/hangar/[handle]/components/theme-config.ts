export const HANGAR_THEMES = {
  CYBER_BAY: {
    label: "hangar.theme.cyberBay",
    gridColor: "#dc2626",
    gridOpacity: 0.04,
    scanLine: true,
    bgGradient: "radial-gradient(ellipse at 50% 0%, #1a0a0a 0%, #09090b 70%)",
  },
  CLEAN_LAB: {
    label: "hangar.theme.cleanLab",
    gridColor: "#ffffff",
    gridOpacity: 0.02,
    scanLine: false,
    bgGradient: "radial-gradient(ellipse at 50% 0%, #0f1015 0%, #09090b 70%)",
  },
  DESERT_BATTLEFIELD: {
    label: "hangar.theme.desertBattlefield",
    gridColor: "#d4a017",
    gridOpacity: 0.03,
    scanLine: false,
    bgGradient: "radial-gradient(ellipse at 50% 80%, #1a150a 0%, #09090b 70%)",
  },
  NEON_TOKYO: {
    label: "hangar.theme.neonTokyo",
    gridColor: "#8b5cf6",
    gridOpacity: 0.05,
    scanLine: true,
    bgGradient: "radial-gradient(ellipse at 50% 0%, #0f0a1a 0%, #09090b 70%)",
  },
} as const;

export type ThemeKey = keyof typeof HANGAR_THEMES;
