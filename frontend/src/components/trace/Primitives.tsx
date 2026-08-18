import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { riskBgClass, riskLabel } from "@/lib/format";
import type { RiskLevel } from "@/types";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border px-4 py-5 md:px-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  delta,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  delta: string;
  tone?: "neutral" | "positive" | "warning";
}) {
  return (
    <div className="panel p-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mono mt-2 text-2xl tabular-nums">{value}</p>
      <p
        className={cn(
          "mt-1 text-[11px]",
          tone === "positive" && "text-risk-low",
          tone === "warning" && "text-risk-medium",
          tone === "neutral" && "text-muted-foreground",
        )}
      >
        {delta}
      </p>
    </div>
  );
}

export function RiskDistribution({
  distribution,
  title = "Risk distribution",
}: {
  distribution: Record<RiskLevel, number>;
  title?: string;
}) {
  const levels: RiskLevel[] = ["low", "medium", "high", "critical"];
  const max = Math.max(...levels.map((l) => distribution[l]), 1);

  return (
    <section className="panel p-4">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <ul className="mt-4 space-y-2.5">
        {levels.map((level) => (
          <li key={level} className="flex items-center gap-3">
            <span className="w-16 text-xs text-muted-foreground">{riskLabel[level]}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-sm bg-muted">
              <span
                className={cn("block h-full rounded-sm", riskBgClass[level])}
                style={{ width: `${(distribution[level] / max) * 100}%` }}
              />
            </span>
            <span className="mono w-8 text-right text-xs tabular-nums text-muted-foreground">
              {distribution[level]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel = "Analyze a PR",
}: {
  title: string;
  description: string;
  actionLabel?: string;
}) {
  return (
    <div className="panel flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-surface-2">
        <Sparkles className="size-4 text-muted-foreground" aria-hidden />
      </span>
      <h3 className="mt-4 text-sm font-medium">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>
      <Link
        to="/analyze"
        className="mt-5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-ring"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "verified"
      ? "border-risk-low/30 bg-risk-low-soft text-risk-low"
      : status === "failed"
        ? "border-risk-high/30 bg-risk-high-soft text-risk-high"
        : "border-border-strong bg-surface-2 text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        tone,
      )}
    >
      {status}
    </span>
  );
}
