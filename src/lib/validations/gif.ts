import { z } from "zod";

const ALLOWED_GIF_DOMAIN = "https://static.klipy.com/";

const klipyUrlSchema = z
  .string()
  .url()
  .refine((url) => url.startsWith(ALLOWED_GIF_DOMAIN), {
    message: "GIF URL must be from static.klipy.com",
  });

export const gifFieldsSchema = z
  .object({
    gifUrl: klipyUrlSchema.optional().or(z.literal("")),
    gifPreviewUrl: klipyUrlSchema.optional().or(z.literal("")),
    gifWidth: z.coerce.number().int().positive().max(4096).optional(),
    gifHeight: z.coerce.number().int().positive().max(4096).optional(),
    gifSlug: z.string().max(200).optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      const hasGif = data.gifUrl && data.gifUrl !== "";
      const hasOther =
        (data.gifPreviewUrl && data.gifPreviewUrl !== "") ||
        data.gifWidth ||
        data.gifHeight ||
        (data.gifSlug && data.gifSlug !== "");
      // If other GIF fields are set, gifUrl must be set
      return !hasOther || hasGif;
    },
    { message: "gifUrl is required when attaching a GIF" },
  );

export type GifFields = z.infer<typeof gifFieldsSchema>;

/** Parse GIF fields from FormData, returning cleaned values or nulls */
export function parseGifFromFormData(formData: FormData): {
  gifUrl: string | null;
  gifPreviewUrl: string | null;
  gifWidth: number | null;
  gifHeight: number | null;
  gifSlug: string | null;
} {
  const gifUrl = (formData.get("gifUrl") as string) || null;
  if (!gifUrl) {
    return { gifUrl: null, gifPreviewUrl: null, gifWidth: null, gifHeight: null, gifSlug: null };
  }

  // Validate domain
  if (!gifUrl.startsWith(ALLOWED_GIF_DOMAIN)) {
    return { gifUrl: null, gifPreviewUrl: null, gifWidth: null, gifHeight: null, gifSlug: null };
  }

  const gifPreviewUrl = (formData.get("gifPreviewUrl") as string) || null;
  const widthStr = formData.get("gifWidth") as string;
  const heightStr = formData.get("gifHeight") as string;
  const gifWidth = widthStr ? parseInt(widthStr, 10) : null;
  const gifHeight = heightStr ? parseInt(heightStr, 10) : null;
  const gifSlug = (formData.get("gifSlug") as string) || null;

  // Validate preview URL domain too
  if (gifPreviewUrl && !gifPreviewUrl.startsWith(ALLOWED_GIF_DOMAIN)) {
    return { gifUrl, gifPreviewUrl: null, gifWidth, gifHeight, gifSlug };
  }

  return { gifUrl, gifPreviewUrl, gifWidth, gifHeight, gifSlug };
}
