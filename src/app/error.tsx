"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 rounded-2xl bg-red-50 p-3">
        <AlertTriangle className="h-6 w-6 text-red-600" />
      </div>
      <h1 className="text-2xl font-semibold text-slate-900">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        {error.message || "An unexpected error occurred while loading this page."}
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-sakura-600 px-4 py-2 text-sm font-medium text-white hover:bg-sakura-700"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-surface-subtle"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
