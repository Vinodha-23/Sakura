import { Suspense } from "react";
import KnowledgeGraphClient from "./knowledge-graph-client";
import { LoadingScreen } from "@/components/ui/common";

export default function KnowledgeGraphPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading knowledge graph..." />}>
      <KnowledgeGraphClient />
    </Suspense>
  );
}
