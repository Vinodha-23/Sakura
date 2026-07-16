/**
 * Smoke-test free NVIDIA NIM text + multimodal (vision) chat.
 *
 * Usage:
 *   set NVIDIA_API_KEY=nvapi-...
 *   node scripts/test-nvidia-chat.mjs
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const API_KEY = process.env.NVIDIA_API_KEY;
const BASE = "https://integrate.api.nvidia.com/v1";

if (!API_KEY) {
  console.error("Set NVIDIA_API_KEY first.");
  process.exit(1);
}

const TEXT_MODELS = [
  "meta/llama-3.1-8b-instruct",
  "nvidia/nemotron-3-nano-30b-a3b",
  "nvidia/llama-3.1-nemotron-nano-8b-v1",
];

const VISION_MODELS = [
  "meta/llama-3.2-11b-vision-instruct",
  "nvidia/llama-3.1-nemotron-nano-vl-8b-v1",
  "nvidia/nemotron-nano-12b-v2-vl",
  "minimax/minimax-m3",
];

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLE_PNG = resolve(__dirname, "sample-red.png");
const TINY_PNG_B64 = readFileSync(SAMPLE_PNG).toString("base64");

async function chat(model, messages) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 64,
        temperature: 0.2,
        stream: false,
      }),
      signal: controller.signal,
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text.slice(0, 500) };
    }
    return { status: res.status, json };
  } finally {
    clearTimeout(timer);
  }
}

async function tryText() {
  console.log("\n=== Text generation ===");
  for (const model of TEXT_MODELS) {
    process.stdout.write(`→ ${model} … `);
    try {
      const { status, json } = await chat(model, [
        { role: "user", content: "Reply with exactly: NIM_OK" },
      ]);
      const content = json?.choices?.[0]?.message?.content?.trim();
      if (status === 200 && content) {
        console.log(`OK (${status}) — ${content.slice(0, 80)}`);
        return model;
      }
      console.log(`FAIL (${status}) — ${JSON.stringify(json).slice(0, 160)}`);
    } catch (err) {
      console.log(`ERROR — ${err.message}`);
    }
  }
  return null;
}

async function tryVision() {
  console.log("\n=== Multimodal (image + text) ===");
  const messages = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "What dominant color is this image? One word only.",
        },
        {
          type: "image_url",
          image_url: { url: `data:image/png;base64,${TINY_PNG_B64}` },
        },
      ],
    },
  ];

  for (const model of VISION_MODELS) {
    process.stdout.write(`→ ${model} … `);
    try {
      const { status, json } = await chat(model, messages);
      const content = json?.choices?.[0]?.message?.content?.trim();
      if (status === 200 && content) {
        console.log(`OK (${status}) — ${content.slice(0, 120)}`);
        return model;
      }
      console.log(`FAIL (${status}) — ${JSON.stringify(json).slice(0, 220)}`);
    } catch (err) {
      console.log(`ERROR — ${err.message}`);
    }
  }
  return null;
}

const textModel = await tryText();
const visionModel = await tryVision();

console.log("\n=== Summary ===");
console.log(`Text:       ${textModel ? `works (${textModel})` : "failed"}`);
console.log(`Multimodal: ${visionModel ? `works (${visionModel})` : "failed"}`);
console.log(
  "\nFree tier: credits + ~40 req/min on integrate.api.nvidia.com/v1 (OpenAI-compatible).",
);

process.exit(textModel || visionModel ? 0 : 1);
