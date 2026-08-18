import { AlertOctagon, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { riskLabel, riskSoftClass } from "@/lib/format";
import type { RiskLevel } from "@/types";

const icons: Record<RiskLevel, ComponentType<{ className?: string }>> = {
  low: CheckCircle2,
  medium: AlertTriangle,
  high: AlertOctagon,
  critical: AlertOctagon,
};

export function RiskBadge({
  level,
  size = "sm",
  className,
}: {
  level: RiskLevel;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const Icon = icons[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border font-medium uppercase tracking-wide",
        riskSoftClass[level],
        size === "sm" && "px-1.5 py-0.5 text-[10px]",
        size === "md" && "px-2 py-1 text-xs",
        size === "lg" && "px-2.5 py-1.5 text-sm",
        className,
      )}
    >
      <Icon className={cn(size === "lg" ? "size-4" : "size-3")} aria-hidden />
      {riskLabel[level]} risk
    </span>
  );
}

export function LevelPill({ level, label }: { level: RiskLevel; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        riskSoftClass[level],
      )}
    >
      {label ?? riskLabel[level]}
    </span>
  );
}

export function Confidence({ value, className }: { value: number; className?: string }) {
  const level: RiskLevel = value >= 0.85 ? "low" : value >= 0.65 ? "medium" : "high";
  return (
    <span className={cn("inline-flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <span className="relative h-1 w-16 overflow-hidden rounded-full bg-muted">
        <span
          className={cn("absolute inset-y-0 left-0 rounded-full", {
            "bg-risk-low": level === "low",
            "bg-risk-medium": level === "medium",
            "bg-risk-high": level === "high",
          })}
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </span>
      <span className="mono tabular-nums">{Math.round(value * 100)}%</span>
    </span>
  );
}

export function InfoHint({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Info className="size-3" aria-hidden />
      {text}
    </span>
  );
}
