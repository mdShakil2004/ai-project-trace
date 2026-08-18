import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState, PageHeader, StatusPill } from "@/components/trace/Primitives";
import { LevelPill } from "@/components/trace/RiskBadge";
import { api } from "@/services/api";
import { pct, riskLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";

const investigationsQuery = {
  queryKey: ["investigations"],
  queryFn: () => api.listInvestigations(),
};

export const Route = createFileRoute("/investigations")({
  head: () => ({
    meta: [
      { title: "Investigation history — Trace" },
      {
        name: "description",
        content:
          "Every pull request Trace has analyzed, with risk level, verification gaps and confidence, searchable by repository or author.",
      },
      { property: "og:title", content: "Investigation history — Trace" },
      {
        property: "og:description",
        content: "Search past change investigations by repository, author, risk and status.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(investigationsQuery).then(() => {}),
  component: InvestigationsPage,
});

const filters: (RiskLevel | "all")[] = ["all", "low", "medium", "high", "critical"];

function InvestigationsPage() {
  const { data } = useSuspenseQuery(investigationsQuery);
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState<RiskLevel | "all">("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((inv) => {
      const matchesRisk = risk === "all" || inv.risk.level === risk;
      const matchesQuery =
        !q ||
        [inv.repository, inv.pullRequest.title, inv.pullRequest.author, `#${inv.pullRequest.number}`]
          .join(" ")
          .toLowerCase()
          .includes(q);
      return matchesRisk && matchesQuery;
    });
  }, [data, query, risk]);

  return (
    <AppShell>
      <PageHeader
        title="Investigations"
        subtitle="Every pull request Trace has analyzed, with its risk posture and verification state."
      />

      <div className="space-y-4 px-4 py-6 md:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by repository, title, author or PR number"
              aria-label="Search investigations"
              className="w-full rounded-md border border-border bg-background py-2 pl-8 pr-3 text-xs outline-none focus:border-border-strong focus-visible:outline-2 focus-visible:outline-ring"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setRisk(f)}
                className={cn(
                  "rounded-md border px-2.5 py-1.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                  risk === f
                    ? "border-border-strong bg-surface-2 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {f === "all" ? "All risk" : riskLabel[f]}
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="No investigations match this filter"
            description="Try a different repository, author or risk level — or analyze a new pull request."
          />
        ) : (
          <section className="panel overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Repository</th>
                  <th className="px-4 py-2 font-medium">PR</th>
                  <th className="px-4 py-2 font-medium">Title</th>
                  <th className="px-4 py-2 font-medium">Author</th>
                  <th className="px-4 py-2 font-medium">Risk</th>
                  <th className="px-4 py-2 font-medium">Confidence</th>
                  <th className="px-4 py-2 font-medium">Gaps</th>
                  <th className="px-4 py-2 font-medium">Analyzed</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-surface-2"
                  >
                    <td className="mono px-4 py-2.5 text-xs text-muted-foreground">
                      {inv.repository}
                    </td>
                    <td className="mono px-4 py-2.5 text-xs">#{inv.pullRequest.number}</td>
                    <td className="max-w-[280px] px-4 py-2.5 text-xs">
                      <Link
                        to="/investigation/$id"
                        params={{ id: inv.id }}
                        className="block truncate hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        {inv.pullRequest.title}
                      </Link>
                    </td>
                    <td className="mono px-4 py-2.5 text-xs text-muted-foreground">
                      {inv.pullRequest.author}
                    </td>
                    <td className="px-4 py-2.5">
                      <LevelPill level={inv.risk.level} />
                    </td>
                    <td className="mono px-4 py-2.5 text-xs tabular-nums text-muted-foreground">
                      {pct(inv.risk.confidence)}
                    </td>
                    <td className="mono px-4 py-2.5 text-xs tabular-nums text-muted-foreground">
                      {inv.verificationGaps}
                    </td>
                    <td className="mono px-4 py-2.5 text-xs text-muted-foreground">
                      {inv.analyzedAt}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusPill status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </AppShell>
  );
}
