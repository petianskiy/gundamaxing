// Upload limits per build, configurable by future account tier
export interface UploadLimits {
  maxImages: number;
  maxImageSize: number; // bytes
  maxVideos: number;
  maxVideoSize: number; // bytes
  maxVideoDuration: number; // seconds
}

// Limits by tier — "default" is for new users / base tier
const TIER_LIMITS: Record<string, UploadLimits> = {
  default: {
    maxImages: 15,
    maxImageSize: 10 * 1024 * 1024, // 10 MB
    maxVideos: 1,
    maxVideoSize: 150 * 1024 * 1024, // 150 MB
    maxVideoDuration: 60, // 60 seconds
  },
  // Future tiers — uncomment and adjust when tier system is implemented
  // pro: {
  //   maxImages: 30,
  //   maxImageSize: 20 * 1024 * 1024,
  //   maxVideos: 3,
  //   maxVideoSize: 300 * 1024 * 1024,
  //   maxVideoDuration: 120,
  // },
};

export function getLimitsForTier(tier?: string): UploadLimits {
  return TIER_LIMITS[tier ?? "default"] ?? TIER_LIMITS.default;
}

// Validate file on the client side before upload
export function validateImageFile(file: File, limits: UploadLimits): string | null {
  if (!file.type.startsWith("image/")) {
    return "File must be an image";
  }
  if (file.size > limits.maxImageSize) {
    return `Image must be under ${limits.maxImageSize / (1024 * 1024)}MB`;
  }
  return null;
}

export function validateVideoFile(file: File, limits: UploadLimits): string | null {
  if (!file.type.startsWith("video/")) {
    return "File must be a video";
  }
  if (file.size > limits.maxVideoSize) {
    return `Video must be under ${limits.maxVideoSize / (1024 * 1024)}MB`;
  }
  return null;
}
