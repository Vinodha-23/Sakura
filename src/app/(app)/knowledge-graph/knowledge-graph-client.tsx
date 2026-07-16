"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Network,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  User,
  Pill,
  Activity,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/common";
import { buildPatientGraph, getDefaultGraph } from "@/lib/knowledge-graph";
import type { PatientDTO } from "@/lib/patients";
import type { GraphEdge, GraphNode } from "@/lib/types";

const nodeColors: Record<string, string> = {
  patient: "bg-sakura-500 text-white",
  disease: "bg-red-100 text-red-700 border-red-200",
  medication: "bg-emerald-100 text-emerald-700 border-emerald-200",
  guideline: "bg-violet-100 text-violet-700 border-violet-200",
  symptom: "bg-amber-100 text-amber-700 border-amber-200",
};

const nodeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  patient: User,
  disease: Activity,
  medication: Pill,
  guideline: BookOpen,
  symptom: Activity,
};

export default function KnowledgeGraphClient() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");

  const defaults = useMemo(() => getDefaultGraph(), []);
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [nodes, setNodes] = useState<GraphNode[]>(defaults.nodes);
  const [edges, setEdges] = useState<GraphEdge[]>(defaults.edges);
  const [nodePositions, setNodePositions] = useState(defaults.positions);
  const [patientLabel, setPatientLabel] = useState(defaults.patientLabel);
  const [loadingPatient, setLoadingPatient] = useState(false);

  const loadPatientGraph = useCallback(async (id: string) => {
    setLoadingPatient(true);
    try {
      const res = await fetch(`/api/patients/${id}`);
      const data = await res.json();
      if (!res.ok || !data.patient) return;
      const patient = data.patient as PatientDTO;
      const graph = buildPatientGraph(patient);
      setNodes(graph.nodes);
      setEdges(graph.edges);
      setNodePositions(graph.positions);
      setPatientLabel(patient.name);
      setSelectedNode(null);
    } finally {
      setLoadingPatient(false);
    }
  }, []);

  useEffect(() => {
    if (patientId) {
      void loadPatientGraph(patientId);
    } else {
      setNodes(defaults.nodes);
      setEdges(defaults.edges);
      setNodePositions(defaults.positions);
      setPatientLabel(defaults.patientLabel);
    }
  }, [patientId, loadPatientGraph, defaults]);

  const filteredNodes = nodes.filter((n) => {
    if (filter !== "all" && n.type !== filter) return false;
    if (search && !n.label.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = edges.filter(
    (e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
  );

  return (
    <div>
      <PageHeader
        title="Knowledge Graph"
        description={
          loadingPatient
            ? "Loading patient relationships…"
            : `Clinical relationship explorer · ${patientLabel}`
        }
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Knowledge Graph" }]}
        actions={
          <Link href="/patients">
            <Button variant="outline" size="sm">
              Browse Patients
            </Button>
          </Link>
        }
      />

      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {patientId
          ? `Live graph for ${patientLabel} built from conditions and medications on file.`
          : `Sample graph for ${patientLabel} (anticoagulation relationships). Open a patient and use Knowledge Graph to load their live data.`}
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                {["all", "patient", "disease", "medication", "guideline", "symptom"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize ${
                      filter === f
                        ? "bg-sakura-100 text-sakura-700"
                        : "text-slate-500 hover:bg-surface-subtle"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                  className="rounded-lg p-2 text-slate-400 hover:bg-surface-subtle"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="w-12 text-center text-xs text-slate-500">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                  className="rounded-lg p-2 text-slate-400 hover:bg-surface-subtle"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-surface-subtle"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="relative bg-surface-muted" style={{ height: "500px" }}>
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 800 500"
                style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
              >
                {filteredEdges.map((edge) => {
                  const source = nodePositions[edge.source];
                  const target = nodePositions[edge.target];
                  if (!source || !target) return null;
                  const midX = (source.x + target.x) / 2;
                  const midY = (source.y + target.y) / 2;
                  return (
                    <g key={edge.id}>
                      <line
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke="#cbd5e1"
                        strokeWidth={1.5}
                        markerEnd="url(#arrowhead)"
                      />
                      <text
                        x={midX}
                        y={midY - 8}
                        textAnchor="middle"
                        className="fill-slate-400 text-[10px]"
                      >
                        {edge.label}
                      </text>
                    </g>
                  );
                })}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="6"
                    markerHeight="6"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 6 3, 0 6" fill="#cbd5e1" />
                  </marker>
                </defs>

                {filteredNodes.map((node) => {
                  const pos = nodePositions[node.id];
                  if (!pos) return null;
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isSelected ? 32 : 28}
                        className={`${
                          node.type === "patient" ? "fill-sakura-500" : "fill-white"
                        } stroke-2 ${isSelected ? "stroke-sakura-600" : "stroke-slate-200"}`}
                        strokeWidth={isSelected ? 3 : 1.5}
                      />
                      <text
                        x={pos.x}
                        y={pos.y + 45}
                        textAnchor="middle"
                        className="fill-slate-700 text-[11px] font-medium"
                      >
                        {node.label.length > 18 ? node.label.slice(0, 16) + "..." : node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search nodes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {selectedNode ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Node Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge className={nodeColors[selectedNode.type]}>{selectedNode.type}</Badge>
                  <p className="font-medium text-slate-900">{selectedNode.label}</p>
                  <div>
                    <p className="mb-2 text-xs font-medium text-slate-500">Connections</p>
                    {edges
                      .filter(
                        (e) => e.source === selectedNode.id || e.target === selectedNode.id
                      )
                      .map((e) => {
                        const otherId = e.source === selectedNode.id ? e.target : e.source;
                        const other = nodes.find((n) => n.id === otherId);
                        return (
                          <button
                            key={e.id}
                            onClick={() => other && setSelectedNode(other)}
                            className="block w-full rounded-lg p-2 text-left text-xs transition-colors hover:bg-surface-subtle"
                          >
                            <span className="text-slate-400">{e.label}</span>{" "}
                            <span className="font-medium text-slate-700">{other?.label}</span>
                          </button>
                        );
                      })}
                  </div>
                  {selectedNode.type === "patient" && patientId && (
                    <Link href={`/patients/${patientId}`}>
                      <Button size="sm" className="w-full">
                        View Patient Chart
                      </Button>
                    </Link>
                  )}
                  {selectedNode.type === "patient" && !patientId && (
                    <Link href="/patients">
                      <Button size="sm" className="w-full">
                        Browse Patients
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Network className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">Click a node to explore connections</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(nodeColors).map(([type, color]) => {
                const Icon = nodeIcons[type] || Activity;
                return (
                  <div key={type} className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${color.split(" ")[0]}`} />
                    <Icon className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs capitalize text-slate-600">{type}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
