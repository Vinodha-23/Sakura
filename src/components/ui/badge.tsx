import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "critical" | "high" | "medium" | "low" | "success" | "warning" | "info" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium",
        {
          "bg-slate-100 text-slate-700": variant === "default",
          "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20": variant === "critical",
          "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20": variant === "high",
          "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20": variant === "medium",
          "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20": variant === "low",
          "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20": variant === "success",
          "bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20": variant === "warning",
          "bg-sakura-50 text-sakura-700 ring-1 ring-inset ring-sakura-600/20": variant === "info",
          "border border-border bg-white text-slate-600": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}

export function riskBadgeVariant(risk: string): BadgeProps["variant"] {
  const map: Record<string, BadgeProps["variant"]> = {
    critical: "critical",
    high: "high",
    medium: "medium",
    low: "low",
    none: "success",
  };
  return map[risk] || "default";
}

export function severityBadgeVariant(severity: string): BadgeProps["variant"] {
  return riskBadgeVariant(severity);
}
