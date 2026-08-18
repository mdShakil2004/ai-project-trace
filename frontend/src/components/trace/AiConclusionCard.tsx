import { Sparkles } from "lucide-react";
import { Confidence } from "./RiskBadge";
import { confidenceLabel } from "@/lib/format";
import type { AiConclusion, Evidence } from "@/types";

/**
 * Signature Trace pattern: a conclusion is never presented alone.
 * Conclusion → Confidence → Evidence → Unknowns.
 */
export function AiConclusionCard({
  conclusion,
  evidence,
  onEvidenceClick,
}: {
  conclusion: AiConclusion;
  evidence: Evidence[];
  onEvidenceClick?: (id: string) => void;
}) {
  const cited = evidence.filter((e) => conclusion.evidenceIds.includes(e.id));

  return (
    <section className="panel overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-intel-soft/30 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-intel" aria-hidden />
          {conclusion.title}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {confidenceLabel(conclusion.confidence)}
          </span>
          <Confidence value={conclusion.confidence} />
        </div>
      </header>

      <div className="space-y-4 p-4">
        <p className="text-sm leading-relaxed text-foreground/90">{conclusion.statement}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Evidence
            </h4>
            <ul className="mt-2 space-y-1">
              {cited.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onEvidenceClick?.(item.id)}
                    className="mono w-full rounded px-1 py-0.5 text-left text-xs text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    {item.ref} — {item.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Unknown
            </h4>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {conclusion.unknowns.length === 0 && <li>No material unknowns recorded.</li>}
              {conclusion.unknowns.map((unknown) => (
                <li key={unknown} className="flex gap-2">
                  <span aria-hidden className="text-border-strong">
                    •
                  </span>
                  <span>{unknown}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
