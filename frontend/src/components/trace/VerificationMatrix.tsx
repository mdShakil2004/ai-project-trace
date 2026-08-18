import { useState } from "react";
import { AlertTriangle, Check, CircleSlash, Copy, X } from "lucide-react";
import type { ComponentType } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Verification, VerificationCheck, VerificationStatus } from "@/types";

const statusMeta: Record<
  VerificationStatus,
  { label: string; icon: ComponentType<{ className?: string }>; className: string }
> = {
  passed: { label: "Passed", icon: Check, className: "text-risk-low" },
  failed: { label: "Failed", icon: X, className: "text-risk-high" },
  missing: { label: "Missing", icon: AlertTriangle, className: "text-risk-medium" },
  partial: { label: "Partial", icon: CircleSlash, className: "text-risk-medium" },
};

export function VerificationMatrix({ checks }: { checks: VerificationCheck[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="panel divide-y divide-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>Check</span>
        <span>Status</span>
      </div>
      {checks.map((check) => {
        const meta = statusMeta[check.status];
        const Icon = meta.icon;
        const open = openId === check.id;
        return (
          <div key={check.id}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : check.id)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-surface-2 focus-visible:outline-2 -outline-offset-2 focus-visible:outline-ring"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm">{check.name}</span>
                <span className="mono block truncate text-[11px] text-muted-foreground">
                  {check.source}
                  {check.durationMs ? ` · ${(check.durationMs / 1000).toFixed(1)}s` : ""}
                </span>
              </span>
              <span className={cn("inline-flex shrink-0 items-center gap-1.5 text-xs", meta.className)}>
                <Icon className="size-4" aria-hidden />
                {meta.label}
              </span>
            </button>
            {open && (
              <p className="border-t border-border bg-background/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                {check.detail}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function RecommendedTests({ recommended }: { recommended: Verification["recommended"] }) {
  const [openId, setOpenId] = useState<string | null>(recommended[0]?.id ?? null);

  const copy = async (scenario: string) => {
    try {
      await navigator.clipboard.writeText(scenario);
      toast.success("Test scenario copied to clipboard");
    } catch {
      toast.error("Clipboard unavailable in this browser");
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {recommended.map((test, index) => {
        const open = openId === test.id;
        return (
          <article key={test.id} className="panel flex flex-col p-4">
            <h4 className="text-sm font-medium">
              <span className="mono mr-2 text-muted-foreground">{index + 1}.</span>
              {test.title}
            </h4>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{test.rationale}</p>

            <ol className="mono mt-3 space-y-1 rounded-md border border-border bg-background/50 p-3 text-[11.5px]">
              {test.steps.map((step, i) => (
                <li key={step} className="flex items-start gap-2">
                  <span className="text-muted-foreground" aria-hidden>
                    {i === test.steps.length - 1 ? "└" : "├"}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            {open && (
              <pre className="mono mt-3 max-h-64 overflow-auto whitespace-pre rounded-md border border-border bg-background p-3 text-[11.5px] leading-relaxed">
                {test.scenario}
              </pre>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copy(test.scenario)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring"
              >
                <Copy className="size-3.5" aria-hidden />
                Copy test scenario
              </button>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : test.id)}
                aria-expanded={open}
                className="rounded-md border border-intel/40 bg-intel-soft/40 px-2.5 py-1.5 text-xs text-intel transition-colors hover:bg-intel-soft focus-visible:outline-2 focus-visible:outline-ring"
              >
                {open ? "Hide generated test" : "Generate test"}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
