import { Flower2 } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-sakura-600 via-sakura-700 to-slate-900 p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
            <Flower2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-semibold text-white">Sakura</span>
        </div>
        <div>
          <h1 className="text-4xl font-semibold leading-tight text-white">
            Clinical Intelligence<br />for Modern Healthcare
          </h1>
          <p className="mt-4 max-w-md text-lg text-sakura-100">
            Analyze patient records, detect clinical inconsistencies, and make informed decisions with explainable AI.
          </p>
        </div>
        <p className="text-sm text-sakura-200">© 2026 Memorial Hospital System. All rights reserved.</p>
      </div>
      <div className="flex w-full flex-col items-center justify-center bg-surface-muted p-8 lg:w-1/2">
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-400 to-rose-500">
            <Flower2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-semibold text-slate-900">Sakura</span>
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
