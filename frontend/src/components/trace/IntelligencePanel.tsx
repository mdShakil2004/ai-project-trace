import { useState } from "react";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";
import { api } from "@/services/api";
import { Confidence } from "./RiskBadge";
import type { Evidence, Investigation, QuestionAnswer } from "@/types";

const SUGGESTIONS = [
  "Why is this medium risk?",
  "What changed architecturally?",
  "Show me the strongest evidence.",
  "What would you test first?",
  "What assumptions did this PR introduce?",
];

export function IntelligencePanel({
  investigation,
  onTabChange,
  onEvidenceOpen,
}: {
  investigation: Investigation;
  onTabChange: (tab: string) => void;
  onEvidenceOpen: (evidence: Evidence) => void;
}) {
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thread, setThread] = useState<QuestionAnswer[]>([]);

  const ask = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || pending) return;
    setQuestion("");
    setError(null);
    setPending(true);
    try {
      const answer = await api.askInvestigationQuestion(investigation.id, trimmed);
      setThread((t) => [...t, answer]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Trace could not answer that question.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles className="size-4 text-intel" aria-hidden />
        <h2 className="text-sm font-semibold">Trace Intelligence</h2>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            What should I look at first?
          </h3>
          <ol className="mt-3 space-y-2">
            {investigation.priorities.map((item, i) => (
              <li key={item.title}>
                <button
                  type="button"
                  onClick={() => onTabChange(item.tab)}
                  className="w-full rounded-md border border-border bg-surface-2/60 px-3 py-2 text-left transition-colors hover:border-border-strong focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span className="text-xs font-medium">
                    <span className="mono mr-2 text-muted-foreground">{i + 1}.</span>
                    {item.title}
                  </span>
                  <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
                    {item.note}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>

        {thread.map((entry, i) => (
          <section key={`${entry.question}-${i}`} className="space-y-2">
            <p className="rounded-md border border-border bg-surface-2 px-3 py-2 text-xs">
              {entry.question}
            </p>
            <div className="rounded-md border border-intel/25 bg-intel-soft/20 px-3 py-3">
              <p className="text-xs leading-relaxed text-foreground/90">{entry.answer}</p>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Confidence
                </span>
                <Confidence value={entry.confidence} />
              </div>
              {entry.citations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {entry.citations.map((c) => {
                    const evidence = investigation.evidence.find((e) => e.id === c.evidenceId);
                    return (
                      <button
                        key={c.evidenceId}
                        type="button"
                        onClick={() => evidence && onEvidenceOpen(evidence)}
                        disabled={!evidence}
                        className="mono rounded border border-border px-1.5 py-0.5 text-[10px] text-primary hover:bg-surface-2 disabled:cursor-default disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              )}
              {entry.unknowns.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-[10.5px] text-muted-foreground">
                  {entry.unknowns.map((u) => (
                    <li key={u}>Unknown · {u}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}

        {pending && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Reading investigation evidence…
          </p>
        )}

        {error && (
          <div className="rounded-md border border-risk-high/30 bg-risk-high/5 px-3 py-2 text-xs text-risk-high">
            {error}
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Ask about this change
        </h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.slice(0, thread.length ? 2 : 5).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              disabled={pending}
              className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground disabled:cursor-default disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-ring"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          className="mt-3 flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 focus-within:border-border-strong"
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about this investigation…"
            aria-label="Ask about this investigation"
            className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={!question.trim() || pending}
            className="rounded bg-primary p-1 text-primary-foreground disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-ring"
            aria-label="Send question"
          >
            <ArrowUp className="size-3.5" aria-hidden />
          </button>
        </form>
      </div>
    </div>
  );
}
