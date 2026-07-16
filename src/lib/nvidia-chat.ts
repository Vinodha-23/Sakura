import { listAlertsFromDb } from "@/lib/alerts";
import { listDocumentsFromDb } from "@/lib/documents";
import { listClaimsFromDb } from "@/lib/insurance";
import { getPatientFromDb, listPatientsFromDb } from "@/lib/patients";

const CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const TEXT_MODEL = "meta/llama-3.1-8b-instruct";
const VISION_MODEL = "meta/llama-3.2-11b-vision-instruct";

export type ChatTurn = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type ChatImage = {
  mimeType: string;
  contentBase64: string;
};

export type NvidiaChatResult = {
  content: string;
  model: string;
  citations: {
    id: string;
    source: string;
    excerpt: string;
    documentId?: string;
  }[];
  reasoningSteps: string[];
  trustScore: number;
  scopedPatientId?: string;
  scopedPatientName?: string;
};

function getApiKey(): string | undefined {
  return process.env.NVIDIA_API_KEY?.trim() || undefined;
}

async function buildClinicalContext(patientId?: string | null): Promise<{
  context: string;
  scopedPatientName?: string;
  docs: Awaited<ReturnType<typeof listDocumentsFromDb>>;
}> {
  if (patientId) {
    const patient = await getPatientFromDb(patientId);
    if (!patient) {
      throw new Error("Patient not found for AI scope");
    }
    const [alerts, claims, docs] = await Promise.all([
      listAlertsFromDb(),
      listClaimsFromDb(),
      listDocumentsFromDb({ patientId }),
    ]);
    const patientAlerts = alerts.filter((a) => a.patientId === patientId);
    const patientClaims = claims.filter((c) => c.patientId === patientId);

    const context = [
      `FOCUSED PATIENT MODE — answer ONLY about this patient unless the user explicitly asks about someone else:`,
      `Name: ${patient.name}`,
      `MRN: ${patient.mrn} · id=${patient.id}`,
      `Risk: ${patient.riskLevel} · Trust: ${patient.trustScore}%`,
      `Department: ${patient.department || "—"} · Doctor: ${patient.assignedDoctor || "—"}`,
      `Conditions: ${patient.conditions.join("; ") || "none listed"}`,
      `Medications: ${patient.medications.join("; ") || "none listed"}`,
      `Allergies: ${patient.allergies.join("; ") || "none listed"}`,
      patient.vitals
        ? `Vitals: BP ${patient.vitals.bloodPressure || "—"}, HR ${patient.vitals.heartRate ?? "—"}, Temp ${patient.vitals.temperature ?? "—"}, SpO2 ${patient.vitals.oxygenSaturation ?? "—"} (recorded ${patient.vitals.recordedAt || "—"})`
        : "Vitals: none on file",
      "Alerts:",
      patientAlerts
        .map(
          (a) =>
            `- [${a.severity}/${a.status}] ${a.title}: ${a.description} → ${a.recommendedAction || ""}`
        )
        .join("\n") || "- none",
      "Claims:",
      patientClaims
        .map(
          (c) =>
            `- ${c.claimNumber}: ${c.status}, $${c.amount}; missing=${(c.missingDocuments || []).join("|") || "none"}; corrections=${(c.suggestedCorrections || []).join("|") || "none"}`
        )
        .join("\n") || "- none",
      "Documents:",
      docs
        .map((d) => {
          const excerpt = (d.ocrText || d.extractedEntities.join(", ") || "")
            .replace(/\s+/g, " ")
            .slice(0, 200);
          return `- ${d.name} (id=${d.id}, status=${d.status}): ${excerpt || "no OCR text"}`;
        })
        .join("\n") || "- none",
    ].join("\n");

    return { context, scopedPatientName: patient.name, docs };
  }

  const [patients, alerts, claims, docs] = await Promise.all([
    listPatientsFromDb(),
    listAlertsFromDb(),
    listClaimsFromDb(),
    listDocumentsFromDb(),
  ]);

  const patientLines = patients.slice(0, 12).map((p) => {
    const meds = p.medications.slice(0, 6).join("; ") || "none listed";
    const conditions = p.conditions.slice(0, 6).join("; ") || "none listed";
    return `- ${p.name} (${p.mrn}, id=${p.id}): risk=${p.riskLevel}; conditions=${conditions}; meds=${meds}`;
  });

  const alertLines = alerts
    .filter((a) => a.status !== "resolved")
    .slice(0, 10)
    .map(
      (a) =>
        `- [${a.severity}/${a.status}] ${a.title} — ${a.patientName}: ${a.description}`
    );

  const claimLines = claims.slice(0, 8).map(
    (c) =>
      `- ${c.claimNumber} ${c.patientName}: ${c.status}, $${c.amount}, missing=${(c.missingDocuments || []).join("|") || "none"}`
  );

  const docLines = docs.slice(0, 10).map((d) => {
    const excerpt = (d.ocrText || d.extractedEntities.join(", ") || "")
      .replace(/\s+/g, " ")
      .slice(0, 180);
    return `- ${d.name} (id=${d.id}, patient=${d.patientName}): ${excerpt || "no OCR text"}`;
  });

  const context = [
    "PANEL MODE — live Sakura clinical context (synthetic demo data — not real PHI):",
    "Patients:",
    patientLines.join("\n") || "- none",
    "Open clinical alerts:",
    alertLines.join("\n") || "- none",
    "Insurance claims:",
    claimLines.join("\n") || "- none",
    "Documents (use document ids in citations when relevant):",
    docLines.join("\n") || "- none",
  ].join("\n");

  return { context, docs };
}

function parseCitations(
  content: string,
  docs: Awaited<ReturnType<typeof listDocumentsFromDb>>
): NvidiaChatResult["citations"] {
  const citations: NvidiaChatResult["citations"] = [];
  const lower = content.toLowerCase();
  for (const d of docs.slice(0, 20)) {
    const nameHit = lower.includes(d.name.toLowerCase());
    const patientHit = lower.includes(d.patientName.toLowerCase());
    const entityHit = d.extractedEntities.some((e) =>
      lower.includes(e.toLowerCase())
    );
    if (nameHit || (patientHit && entityHit) || entityHit) {
      citations.push({
        id: `cite-${d.id}`,
        source: d.name,
        excerpt: (
          d.ocrText?.split(/\n/).find((l) => l.trim().length > 20) ||
          d.extractedEntities.join(", ") ||
          d.type
        ).slice(0, 220),
        documentId: d.id,
      });
    }
    if (citations.length >= 3) break;
  }
  return citations;
}

export async function runNvidiaClinicalChat(input: {
  messages: ChatTurn[];
  image?: ChatImage | null;
  patientId?: string | null;
}): Promise<NvidiaChatResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "NVIDIA_API_KEY is not set. Add a free key from build.nvidia.com."
    );
  }

  const { context, scopedPatientName, docs } = await buildClinicalContext(
    input.patientId
  );

  const systemPrompt = [
    "You are Sakura, a clinical intelligence assistant for physicians.",
    "Answer using the provided live context when relevant. Be concise, evidence-oriented, and cautious.",
    "Do not invent patient facts outside the context. If unsure, say what is missing.",
    "Prefer bullet findings and clear recommendations. Mention document names when citing.",
    input.patientId
      ? `Stay focused on ${scopedPatientName || "the selected patient"}.`
      : "",
    "",
    context,
  ]
    .filter(Boolean)
    .join("\n");

  const useVision = Boolean(input.image?.contentBase64 && input.image.mimeType);
  const model = useVision ? VISION_MODEL : TEXT_MODEL;

  const history = input.messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-12);

  type OpenAIContent =
    | string
    | { type: "text"; text: string }[]
    | {
        type: "text" | "image_url";
        text?: string;
        image_url?: { url: string };
      }[];

  const openaiMessages: { role: string; content: OpenAIContent }[] = [
    { role: "system", content: systemPrompt },
  ];

  for (let i = 0; i < history.length; i++) {
    const m = history[i];
    const isLastUser =
      useVision && m.role === "user" && i === history.length - 1;
    if (isLastUser && input.image) {
      openaiMessages.push({
        role: "user",
        content: [
          { type: "text", text: m.content || "Describe this clinical image." },
          {
            type: "image_url",
            image_url: {
              url: `data:${input.image.mimeType};base64,${input.image.contentBase64}`,
            },
          },
        ],
      });
    } else {
      openaiMessages.push({ role: m.role, content: m.content });
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  try {
    const res = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model,
        messages: openaiMessages,
        temperature: 0.4,
        max_tokens: 1024,
        stream: false,
      }),
      signal: controller.signal,
    });

    const raw = await res.text();
    let json: {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string } | string;
    };
    try {
      json = JSON.parse(raw);
    } catch {
      throw new Error(`NVIDIA returned non-JSON (${res.status})`);
    }
    if (!res.ok) {
      const err =
        typeof json.error === "string"
          ? json.error
          : json.error?.message || `HTTP ${res.status}`;
      throw new Error(err);
    }

    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("Empty response from NVIDIA model");

    const citations = parseCitations(content, docs);
    const reasoningSteps = [
      `Routed to ${model}${useVision ? " (vision)" : " (text)"}`,
      input.patientId
        ? `Scoped context to patient ${scopedPatientName || input.patientId}`
        : "Loaded full panel patients, alerts, claims, and documents",
      citations.length
        ? `Matched ${citations.length} document citation(s) from Sakura records`
        : "No direct document citation match in reply",
      "Generated clinician-facing answer with free NVIDIA NIM",
    ];

    return {
      content,
      model,
      citations,
      reasoningSteps,
      trustScore: citations.length >= 2 ? 92 : citations.length === 1 ? 86 : 78,
      scopedPatientId: input.patientId || undefined,
      scopedPatientName,
    };
  } finally {
    clearTimeout(timer);
  }
}
