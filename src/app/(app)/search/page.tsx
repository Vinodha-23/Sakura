import { Suspense } from "react";
import { LoadingScreen } from "@/components/ui/common";
import SearchPage from "./search-content";

export default function SearchPageWrapper() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading search..." />}>
      <SearchPage />
    </Suspense>
  );
}
