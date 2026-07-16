import type { GraphEdge, GraphNode } from "@/lib/types";
import type { PatientDTO } from "@/lib/patients";
import { graphEdges as defaultEdges, graphNodes as defaultNodes } from "@/lib/mock-data";

function slug(label: string, prefix: string) {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${prefix}-${base || "item"}`;
}

/** Build a patient-scoped clinical relationship graph from live patient data. */
export function buildPatientGraph(patient: PatientDTO): {
  nodes: GraphNode[];
  edges: GraphEdge[];
  positions: Record<string, { x: number; y: number }>;
} {
  const nodes: GraphNode[] = [{ id: "patient", label: patient.name, type: "patient" }];
  const edges: GraphEdge[] = [];
  const positions: Record<string, { x: number; y: number }> = {
    patient: { x: 400, y: 250 },
  };

  const conditions = patient.conditions.slice(0, 5);
  const medications = patient.medications.slice(0, 6);

  conditions.forEach((condition, i) => {
    const id = slug(condition, "dx");
    nodes.push({ id, label: condition, type: "disease" });
    edges.push({
      id: `e-dx-${i}`,
      source: "patient",
      target: id,
      label: "diagnosed with",
    });
    const angle = (Math.PI * 1.2 * i) / Math.max(conditions.length, 1) - 0.6;
    positions[id] = {
      x: 400 + Math.cos(angle) * 180,
      y: 120 + Math.sin(angle) * 40 + (i % 2) * 30,
    };
  });

  medications.forEach((med, i) => {
    const short = med.split(/\s+/).slice(0, 2).join(" ");
    const id = slug(short, "med");
    nodes.push({ id, label: short, type: "medication" });
    edges.push({
      id: `e-med-${i}`,
      source: "patient",
      target: id,
      label: "prescribed",
    });
    const angle = Math.PI * 0.15 + (Math.PI * 0.7 * i) / Math.max(medications.length, 1);
    positions[id] = {
      x: 120 + Math.cos(angle) * 80 + i * 90,
      y: 360 + (i % 2) * 40,
    };
  });

  const medLower = medications.map((m) => m.toLowerCase());
  const hasWarfarin = medLower.some((m) => m.includes("warfarin"));
  const hasAspirin = medLower.some((m) => m.includes("aspirin"));
  if (hasWarfarin && hasAspirin) {
    nodes.push({ id: "bleeding", label: "Bleeding Risk", type: "symptom" });
    positions.bleeding = { x: 100, y: 150 };
    const warf = nodes.find((n) => n.label.toLowerCase().includes("warfarin"));
    const asp = nodes.find((n) => n.label.toLowerCase().includes("aspirin"));
    if (warf) {
      edges.push({
        id: "e-bleed-w",
        source: warf.id,
        target: "bleeding",
        label: "risk of",
      });
    }
    if (asp) {
      edges.push({
        id: "e-bleed-a",
        source: asp.id,
        target: "bleeding",
        label: "risk of",
      });
    }
  }

  if (conditions.some((c) => /fibrillation|afib|a-fib/i.test(c))) {
    nodes.push({ id: "guideline1", label: "ACC/AHA AFib Guidelines", type: "guideline" });
    positions.guideline1 = { x: 400, y: 50 };
    const afib = nodes.find((n) => /fibrillation|afib/i.test(n.label));
    if (afib) {
      edges.push({
        id: "e-guide",
        source: "guideline1",
        target: afib.id,
        label: "addresses",
      });
    }
  }

  return { nodes, edges, positions };
}

export function getDefaultGraph() {
  return {
    nodes: defaultNodes,
    edges: defaultEdges,
    positions: {
      patient: { x: 400, y: 250 },
      afib: { x: 250, y: 120 },
      diabetes: { x: 550, y: 120 },
      ckd: { x: 250, y: 380 },
      warfarin: { x: 100, y: 250 },
      aspirin: { x: 150, y: 350 },
      metformin: { x: 650, y: 250 },
      bleeding: { x: 100, y: 150 },
      guideline1: { x: 400, y: 50 },
    } as Record<string, { x: number; y: number }>,
    patientLabel: "James Mitchell",
  };
}
