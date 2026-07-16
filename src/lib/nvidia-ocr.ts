const PADDLE_OCR_URL = "https://ai.api.nvidia.com/v1/cv/baidu/paddleocr";
const VL_MODEL = "meta/llama-3.2-11b-vision-instruct";
const CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

const IMAGE_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

export function isImageMime(mime: string): boolean {
  return IMAGE_MIME.has(mime.toLowerCase());
}

export function isPlainTextMime(mime: string, fileName?: string): boolean {
  const m = mime.toLowerCase();
  if (m === "text/plain" || m.startsWith("text/plain")) return true;
  if (fileName?.toLowerCase().endsWith(".txt")) return true;
  return false;
}

export type OcrRunResult = {
  ok: boolean;
  text: string;
  entities: string[];
  error: string | null;
};

function getApiKey(): string | undefined {
  return process.env.NVIDIA_API_KEY?.trim() || undefined;
}

/** Pull readable text from varied PaddleOCR / NIM response shapes. */
export function normalizeOcrResponse(json: unknown): string {
  if (!json || typeof json !== "object") return "";
  const root = json as Record<string, unknown>;

  const chunks: string[] = [];

  const walk = (node: unknown) => {
    if (node == null) return;
    if (typeof node === "string") {
      if (node.trim()) chunks.push(node.trim());
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (typeof node !== "object") return;
    const obj = node as Record<string, unknown>;
    for (const key of [
      "text",
      "content",
      "transcription",
      "ocr_text",
      "merged_text",
    ]) {
      if (typeof obj[key] === "string" && (obj[key] as string).trim()) {
        chunks.push((obj[key] as string).trim());
      }
    }
    if (obj.data != null) walk(obj.data);
    if (obj.output != null) walk(obj.output);
    if (obj.results != null) walk(obj.results);
    if (obj.predictions != null) walk(obj.predictions);
    if (obj.detections != null) walk(obj.detections);
  };

  walk(root);
  // De-dupe while preserving order
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const c of chunks) {
    if (!seen.has(c)) {
      seen.add(c);
      unique.push(c);
    }
  }
  return unique.join("\n").trim();
}

const CLINICAL_HINTS =
  /\b(warfarin|aspirin|metformin|lisinopril|tamoxifen|insulin|creatinine|egfr|hba1c|mmse|afib|atrial fibrillation|ckd|copd|dementia|diabetes|hypertension|inr|mri|pathology|chemotherapy)\b/gi;

export function extractClinicalEntities(text: string, limit = 24): string[] {
  if (!text?.trim()) return [];
  const found = new Set<string>();

  for (const match of text.matchAll(CLINICAL_HINTS)) {
    const raw = match[0];
    const normalized =
      raw.length <= 3
        ? raw.toUpperCase()
        : raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    found.add(normalized);
  }

  // Capitalized multi-word phrases (e.g. "Atrial Fibrillation")
  for (const match of text.matchAll(
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g
  )) {
    const phrase = match[1];
    if (phrase.length >= 6 && phrase.length <= 60) found.add(phrase);
  }

  // Lab-ish patterns: "Creatinine 1.8", "MMSE 18/30"
  for (const match of text.matchAll(
    /\b([A-Za-z]{2,}(?:\s+[A-Za-z]{2,})?)\s*[:=]?\s*(\d+(?:\.\d+)?(?:\/\d+)?%?)\b/g
  )) {
    const label = match[1];
    const value = match[2];
    if (label.length >= 3) found.add(`${label} ${value}`);
  }

  return Array.from(found).slice(0, limit);
}

async function callPaddleOcr(
  apiKey: string,
  mimeType: string,
  contentBase64: string
): Promise<{ text: string; error: string | null }> {
  const dataUrl = `data:${mimeType};base64,${contentBase64}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(PADDLE_OCR_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        input: [{ type: "image_url", url: dataUrl }],
        merge_levels: ["paragraph"],
      }),
      signal: controller.signal,
    });

    const raw = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return {
        text: "",
        error: `PaddleOCR returned non-JSON (${res.status}): ${raw.slice(0, 200)}`,
      };
    }

    if (!res.ok) {
      const msg =
        (json as { error?: string | { message?: string } })?.error ??
        `HTTP ${res.status}`;
      const errStr =
        typeof msg === "string" ? msg : msg?.message || JSON.stringify(msg);
      return { text: "", error: `PaddleOCR failed: ${errStr}` };
    }

    const text = normalizeOcrResponse(json);
    return { text, error: text ? null : "PaddleOCR returned empty text" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { text: "", error: `PaddleOCR error: ${message}` };
  } finally {
    clearTimeout(timer);
  }
}

async function callVisionEntities(
  apiKey: string,
  mimeType: string,
  contentBase64: string
): Promise<string[]> {
  const dataUrl = `data:${mimeType};base64,${contentBase64}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);

  try {
    const res = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: VL_MODEL,
        max_tokens: 256,
        temperature: 0.1,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "List clinical entities in this document (medications, diagnoses, lab values). Reply with a short bullet list only, one entity per line.",
              },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) return [];
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content || "";
    return content
      .split(/\n/)
      .map((line) => line.replace(/^[-*•]\s*/, "").trim())
      .filter((line) => line.length >= 2 && line.length <= 80)
      .slice(0, 16);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function runDocumentOcr(input: {
  mimeType: string;
  contentBase64: string;
}): Promise<OcrRunResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      ok: false,
      text: "",
      entities: [],
      error:
        "NVIDIA_API_KEY is not set. Add a free key from build.nvidia.com to enable OCR.",
    };
  }

  if (!isImageMime(input.mimeType)) {
    return {
      ok: false,
      text: "",
      entities: [],
      error: "OCR requires an image (PNG/JPG/WEBP).",
    };
  }

  const paddle = await callPaddleOcr(
    apiKey,
    input.mimeType,
    input.contentBase64
  );

  let text = paddle.text;
  let entities = extractClinicalEntities(text);
  let error = paddle.error;

  if (entities.length < 2) {
    const vlEntities = await callVisionEntities(
      apiKey,
      input.mimeType,
      input.contentBase64
    );
    if (vlEntities.length) {
      entities = Array.from(new Set([...entities, ...vlEntities])).slice(0, 24);
      if (!text && vlEntities.length) {
        text = vlEntities.join("\n");
        error = null;
      }
    }
  }

  const ok = Boolean(text.trim()) || entities.length > 0;
  return {
    ok,
    text,
    entities,
    error: ok ? null : error || "OCR produced no usable text",
  };
}
