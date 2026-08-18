import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Check, Github, Loader2, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/trace/Primitives";
import { api, TraceApiError } from "@/services/api";
import type { AnalysisEvent } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "Analyze a pull request — Trace" },
      {
        name: "description",
        content:
          "Give Trace a GitHub pull request and Trace reconstructs the change, intent, impact and verification gaps.",
      },
      { property: "og:title", content: "Analyze a pull request — Trace" },
    ],
  }),
  component: AnalyzePage,
});

type Phase = "idle" | "running" | "error";

function isGitHubPullRequestUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "github.com") return false;
    const parts = url.pathname.split("/").filter(Boolean);
    return parts.length === 4 && parts[2] === "pull" && /^\d+$/.test(parts[3]);
  } catch {
    return false;
  }
}

function upsertEvent(events: AnalysisEvent[], next: AnalysisEvent) {
  const index = events.findIndex((event) => event.id === next.id);
  if (index === -1) return [...events, next];
  const copy = events.slice();
  copy[index] = { ...copy[index], ...next };
  return copy;
}

function AnalyzePage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [events, setEvents] = useState<AnalysisEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [investigationId, setInvestigationId] = useState<string | null>(null);
  const [realtimeToken, setRealtimeToken] = useState<string | null>(null);
  const [started, setStarted] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (phase !== "running" || !investigationId) return;

    let cancelled = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
    let unsubscribe: (() => void) | undefined;
    let usingFallback = false;

    const finish = async () => {
      try {
        await navigate({ to: "/investigation/$id", params: { id: investigationId } });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to open investigation");
          setPhase("error");
        }
      }
    };

    const schedulePoll = () => {
      if (!cancelled) fallbackTimer = setTimeout(poll, 1500);
    };

    const poll = async () => {
      try {
        const next = await api.getEvents(investigationId);
        if (!cancelled) setEvents(next);

        try {
          await api.getInvestigation(investigationId);
          if (!cancelled) await finish();
        } catch (err) {
          if (err instanceof TraceApiError && err.code === "ANALYSIS_IN_PROGRESS") {
            schedulePoll();
            return;
          }
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "Analysis failed.");
            setPhase("error");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to read analysis progress.");
          setPhase("error");
        }
      }
    };

    const startRealtime = () => {
      if (!realtimeToken) {
        usingFallback = true;
        void poll();
        return;
      }

      unsubscribe = api.subscribeInvestigation(investigationId, realtimeToken, {
        onEvents: (next) => {
          if (!cancelled) setEvents(next);
        },
        onStage: (stage) => {
          if (!cancelled) setEvents((current) => upsertEvent(current, stage));
        },
        onComplete: () => {
          void finish();
        },
        onError: (message) => {
          if (!usingFallback && !cancelled) {
            usingFallback = true;
            void poll();
          }
          if (message === "Received an invalid realtime event." && !cancelled) {
            setError(message);
          }
        },
      });
    };

    startRealtime();

    return () => {
      cancelled = true;
      unsubscribe?.();
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [phase, investigationId, realtimeToken, navigate]);

  useEffect(() => {
    if (!started) {
      setElapsed(0);
      return;
    }

    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [started]);

  const start = async () => {
    const value = url.trim();
    setError(null);
    setEvents([]);

    if (!value) {
      setPhase("error");
      setError("Enter a GitHub pull request URL.");
      return;
    }

    if (!isGitHubPullRequestUrl(value)) {
      setPhase("error");
      setError("Enter a valid GitHub pull request URL, for example https://github.com/owner/repo/pull/123.");
      return;
    }

    try {
      const result = await api.analyzePullRequest(value);
      setInvestigationId(result.investigationId);
      setRealtimeToken(result.realtimeToken ?? null);
      setStarted(Date.now());
      setPhase("running");
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Analysis failed.");
    }
  };

  const completedStages = events.filter((event) => event.status === "done").length;

  return (
    <AppShell>
      <PageHeader
        title="Analyze a Pull Request"
        subtitle="Give Trace a GitHub PR and we'll reconstruct the change, its intent, impact, and verification gaps."
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-6">
        {phase !== "running" && (
          <section className="panel p-5">
            <label htmlFor="pr-url" className="text-xs font-medium">
              GitHub Pull Request URL
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="pr-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void start()}
                placeholder="https://github.com/owner/repo/pull/123"
                className="mono min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:border-border-strong"
              />
              <button
                type="button"
                disabled={!url.trim()}
                onClick={() => void start()}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                <Sparkles className="size-4" />
                Analyze PR
              </button>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Trace reads the diff, linked discussion, git history and checks. Nothing is written back to the repository.
            </p>
          </section>
        )}

        {phase === "error" && (
          <section className="panel border-risk-high/30 p-5">
            <h2 className="flex items-center gap-2 text-sm font-medium text-risk-high">
              <AlertTriangle className="size-4" />
              We couldn't analyze this pull request.
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">{error}</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => void start()}
                className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => setPhase("idle")}
                className="rounded-md border border-border px-3 py-1.5 text-xs"
              >
                Edit URL
              </button>
            </div>
          </section>
        )}

        {phase === "running" && (
          <section className="panel p-5">
            <header className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="mono text-sm">Analyzing pull request</h2>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {completedStages > 0 ? `${completedStages} stage${completedStages === 1 ? "" : "s"} complete` : "Waiting for analysis events"}
                </p>
              </div>
              <span className="mono text-xs text-muted-foreground">{elapsed}s</span>
            </header>

            {events.length === 0 ? (
              <p className="mt-4 text-xs text-muted-foreground">
                Trace has started the investigation. Waiting for the first backend progress event…
              </p>
            ) : (
              <ol className="mt-4 space-y-3">
                {events.map((item) => {
                  const state = item.status;
                  return (
                    <li key={item.id} className="flex items-start gap-3">
                      <span className="mt-0.5">
                        {state === "done" && <Check className="size-4 text-risk-low" />}
                        {state === "active" && <Loader2 className="size-4 animate-spin text-intel" />}
                        {state === "pending" && <span className="block size-3.5 rounded-full border border-border-strong" />}
                      </span>
                      <span className={cn("min-w-0 text-sm", state === "pending" && "text-muted-foreground")}>
                        {item.label}
                        {item.detail && state !== "pending" && (
                          <span className="mono block text-[11px] text-muted-foreground">{item.detail}</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        )}

        {phase !== "running" && (
          <section className="panel border-risk-medium/30 p-5">
            <h2 className="flex items-center gap-2 text-sm font-medium text-risk-medium">
              <AlertTriangle className="size-4" />
              <span>How Trace analyzes a PR</span>
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              It fetches the pull request, changed files, history, discussion and checks, then uses the configured OpenRouter model to produce evidence-linked change intelligence.
            </p>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
              <Github className="size-3.5" />
              Read-only GitHub access
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
