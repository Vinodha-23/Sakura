import Link from "next/link";
import { Flower2 } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500">
        <Flower2 className="h-6 w-6 text-white" />
      </div>
      <h1 className="text-2xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        That route does not exist, or the record may have been removed.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/dashboard"
          className="rounded-xl bg-sakura-600 px-4 py-2 text-sm font-medium text-white hover:bg-sakura-700"
        >
          Back to dashboard
        </Link>
        <Link
          href="/patients"
          className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-surface-subtle"
        >
          Patients
        </Link>
      </div>
    </div>
  );
}
