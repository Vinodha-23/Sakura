/**
 * Quick NVIDIA NIM text-to-image smoke test.
 *
 * Usage:
 *   set NVIDIA_API_KEY=nvapi-...
 *   node scripts/test-nvidia-t2i.mjs ["optional prompt"]
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const API_KEY = process.env.NVIDIA_API_KEY;
const PROMPT =
  process.argv[2] ||
  "a cherry blossom tree beside a calm lake at dusk, soft cinematic light";

if (!API_KEY) {
  console.error("Set NVIDIA_API_KEY first.");
  process.exit(1);
}

const MODELS = [
  {
    name: "black-forest-labs/flux.1-schnell",
    url: "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell",
    body: {
      prompt: PROMPT,
      seed: 0,
      width: 1024,
      height: 1024,
    },
  },
  {
    name: "black-forest-labs/flux.1-dev",
    url: "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-dev",
    body: {
      prompt: PROMPT,
      seed: 0,
      width: 1024,
      height: 1024,
    },
  },
  {
    name: "stabilityai/stable-diffusion-3-medium",
    url: "https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-3-medium",
    body: {
      prompt: PROMPT,
      cfg_scale: 5,
      aspect_ratio: "1:1",
      seed: 0,
      steps: 28,
      negative_prompt: "",
    },
  },
  {
    name: "qwen/qwen-image (images/generations)",
    url: "https://ai.api.nvidia.com/v1/images/generations",
    body: {
      model: "qwen/qwen-image",
      prompt: PROMPT,
      n: 1,
      response_format: "b64_json",
    },
  },
];

function extractBase64(json) {
  if (typeof json?.image === "string") return json.image;
  if (typeof json?.b64_json === "string") return json.b64_json;
  if (json?.artifacts?.[0]?.base64) return json.artifacts[0].base64;
  if (json?.data?.[0]?.b64_json) return json.data[0].b64_json;
  if (json?.images?.[0]) {
    const img = json.images[0];
    if (typeof img === "string") return img;
    if (typeof img?.base64 === "string") return img.base64;
    if (typeof img?.b64_json === "string") return img.b64_json;
  }
  return null;
}

async function tryModel(model) {
  console.log(`\n→ Trying ${model.name}`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  let res;
  try {
    res = await fetch(model.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(model.body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  if (!res.ok) {
    console.log(`  HTTP ${res.status}`);
    console.log(`  ${text.slice(0, 500)}`);
    return false;
  }

  const b64 = extractBase64(json);
  if (!b64) {
    console.log("  OK response, but no image field found:");
    console.log(`  ${text.slice(0, 500)}`);
    return false;
  }

  const out = resolve("scripts", "nvidia-t2i-out.png");
  writeFileSync(out, Buffer.from(b64, "base64"));
  console.log(`  Success — saved ${out}`);
  return true;
}

console.log("Prompt:", PROMPT);

for (const model of MODELS) {
  try {
    const ok = await tryModel(model);
    if (ok) {
      console.log("\nText-to-image works with this key.");
      process.exit(0);
    }
  } catch (err) {
    console.log(`  Error: ${err.message}`);
  }
}

console.log("\nNo working image model for this key/account.");
process.exit(1);
