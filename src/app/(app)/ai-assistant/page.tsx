import { Suspense } from "react";
import { LoadingScreen } from "@/components/ui/common";
import { AIAssistantClient } from "./ai-assistant-client";

export default function AIAssistantPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading assistant..." />}>
      <AIAssistantClient />
    </Suspense>
  );
}
