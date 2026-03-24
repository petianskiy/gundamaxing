/**
 * Google Cloud Vision REST API wrapper.
 * Uses the TEXT_DETECTION and DOCUMENT_TEXT_DETECTION features.
 * No SDK needed — direct fetch to the REST endpoint.
 */

const VISION_API_URL = "https://vision.googleapis.com/v1/images:annotate";

export interface VisionWord {
  text: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
}

export interface VisionAnnotation {
  description: string;
  boundingPoly: { vertices: Array<{ x: number; y: number }> };
}

export interface VisionResponse {
  fullText: string;
  words: VisionWord[];
  annotations: VisionAnnotation[];
  rawResponse: unknown;
}

function getApiKey(): string {
  const key = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!key) throw new Error("GOOGLE_CLOUD_VISION_API_KEY is not set");
  return key;
}

function vertexToBbox(vertices: Array<{ x?: number; y?: number }>) {
  const xs = vertices.map((v) => v.x ?? 0);
  const ys = vertices.map((v) => v.y ?? 0);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return {
    x: minX,
    y: minY,
    width: Math.max(...xs) - minX,
    height: Math.max(...ys) - minY,
  };
}

export interface CardBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Infer card boundaries from text annotation positions.
 * All text on a Gundam card is ON the card, so the bounding box
 * of all detected text gives us a tight crop of the card area.
 */
export function inferCardBounds(annotations: VisionAnnotation[], imgW: number, imgH: number, padding = 0.03): CardBounds | null {
  if (annotations.length < 3) return null;

  let minX = imgW, minY = imgH, maxX = 0, maxY = 0;
  for (const a of annotations) {
    for (const v of a.boundingPoly.vertices) {
      const x = v.x ?? 0;
      const y = v.y ?? 0;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  // Add padding (percentage of image dimensions)
  const padX = imgW * padding;
  const padY = imgH * padding;
  minX = Math.max(0, minX - padX);
  minY = Math.max(0, minY - padY);
  maxX = Math.min(imgW, maxX + padX);
  maxY = Math.min(imgH, maxY + padY);

  const w = maxX - minX;
  const h = maxY - minY;

  // Sanity check: card should be a reasonable size
  if (w < imgW * 0.1 || h < imgH * 0.1) return null;

  return { x: Math.round(minX), y: Math.round(minY), width: Math.round(w), height: Math.round(h) };
}

export async function detectText(imageBase64: string): Promise<VisionResponse> {
  const response = await fetch(`${VISION_API_URL}?key=${getApiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [
        {
          image: { content: imageBase64 },
          features: [
            { type: "TEXT_DETECTION", maxResults: 50 },
            { type: "DOCUMENT_TEXT_DETECTION" },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Vision API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const result = data.responses?.[0];

  if (!result) throw new Error("No response from Vision API");
  if (result.error) throw new Error(`Vision API: ${result.error.message}`);

  const annotations: VisionAnnotation[] = (result.textAnnotations ?? []).slice(1); // skip the first (full text)
  const fullText = result.textAnnotations?.[0]?.description ?? "";

  // Extract words with bounding boxes and confidence from DOCUMENT_TEXT_DETECTION
  const words: VisionWord[] = [];
  const pages = result.fullTextAnnotation?.pages ?? [];
  for (const page of pages) {
    for (const block of page.blocks ?? []) {
      for (const paragraph of block.paragraphs ?? []) {
        for (const word of paragraph.words ?? []) {
          const text = word.symbols?.map((s: { text: string }) => s.text).join("") ?? "";
          const conf = word.confidence ?? 0;
          const bbox = word.boundingBox?.vertices
            ? vertexToBbox(word.boundingBox.vertices)
            : { x: 0, y: 0, width: 0, height: 0 };
          if (text) words.push({ text, confidence: conf, boundingBox: bbox });
        }
      }
    }
  }

  return { fullText, words, annotations, rawResponse: data };
}
