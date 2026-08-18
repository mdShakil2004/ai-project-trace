import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Github, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MetricCard, RiskDistribution, StatusPill } from "@/components/trace/Primitives";
import { LevelPill } from "@/components/trace/RiskBadge";
import { api } from "@/services/api";
import { pct } from "@/lib/format";

const metricsQuery = { queryKey: ["overview-metrics"], queryFn: () => api.getOverviewMetrics() };
const investigationsQuery = { queryKey: ["investigations"], queryFn: () => api.listInvestigations() };
const githubQuery = { queryKey: ["github-connection"], queryFn: () => api.getGitHubConnection() };
const currentUserQuery = { queryKey: ["current-user"], queryFn: () => api.getCurrentUser() };

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Trace — AI Change Intelligence for pull requests" },
    { name: "description", content: "Trace reconstructs what a pull request changed, why, what it affects, and what remains unverified — with evidence behind every conclusion." },
    { property: "og:title", content: "Trace — AI Change Intelligence" },
    { property: "og:description", content: "Understand the change. Verify the reasoning. Ship with confidence. Evidence-backed change intelligence for AI-generated code." },
  ] }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(metricsQuery),
      context.queryClient.ensureQueryData(investigationsQuery),
      context.queryClient.ensureQueryData(githubQuery),
      context.queryClient.ensureQueryData(currentUserQuery),
    ]);
  },
  component: OverviewPage,
});

function OverviewPage() {
  const { data: metrics } = useSuspenseQuery(metricsQuery);
  const { data: investigations } = useSuspenseQuery(investigationsQuery);
  const { data: github } = useSuspenseQuery(githubQuery);
  const { data: currentUser } = useSuspenseQuery(currentUserQuery);
  const navigate = useNavigate();
  const displayName = currentUser.user.name || currentUser.user.login || currentUser.user.email || "there";

  const connectGitHub = () => {
    if (github.connected) {
      navigate({ to: "/settings" });
      return;
    }
    api.loginWithGitHub();
  };

  return <AppShell>
    <div className="border-b border-border px-4 py-6 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-xl font-semibold tracking-tight">Welcome, {displayName}</h1><p className="mt-1 text-sm text-muted-foreground">Understand what changed before you approve it.</p></div>
        <div className="flex flex-wrap gap-2">
          <Link to="/analyze" className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-ring"><Sparkles className="size-4" aria-hidden />Analyze a Pull Request</Link>
          <button type="button" onClick={connectGitHub} title={github.connected ? `Connected to ${github.account ?? "GitHub"}` : "Connect your GitHub account"} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring"><Github className="size-4" aria-hidden />{github.connected ? "GitHub connected" : "Connect GitHub"}</button>
        </div>
      </div>
    </div>

    <div className="space-y-6 px-4 py-6 md:px-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Investigations" value={metrics.investigations.value} delta={metrics.investigations.delta} />
        <MetricCard label="High-risk changes" value={metrics.highRisk.value} delta={metrics.highRisk.delta} tone="warning" />
        <MetricCard label="Verification gaps" value={metrics.verificationGaps.value} delta={metrics.verificationGaps.delta} tone="positive" />
        <MetricCard label="Avg. analysis time" value={metrics.avgAnalysis.value} delta={metrics.avgAnalysis.delta} tone="positive" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <section className="panel overflow-hidden">
          <header className="flex items-center justify-between border-b border-border px-4 py-3"><h2 className="text-sm font-semibold">Recent investigations</h2><Link to="/investigations" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">View all<ArrowRight className="size-3" aria-hidden /></Link></header>
          {investigations.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-muted-foreground">No investigations yet. Start by analyzing a GitHub pull request.</div>
          ) : (
            <>
              <div className="hidden md:block"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground"><th className="px-4 py-2 font-medium">PR</th><th className="px-4 py-2 font-medium">Repository</th><th className="px-4 py-2 font-medium">Title</th><th className="px-4 py-2 font-medium">Author</th><th className="px-4 py-2 font-medium">Risk</th><th className="px-4 py-2 font-medium">Verification</th><th className="px-4 py-2 font-medium">Time</th><th className="px-4 py-2 font-medium">Status</th></tr></thead><tbody>{investigations.slice(0, 6).map((inv) => <tr key={inv.id} tabIndex={0} role="link" onClick={() => navigate({ to: "/investigation/$id", params: { id: inv.id } })} onKeyDown={(e) => { if (e.key === "Enter") navigate({ to: "/investigation/$id", params: { id: inv.id } }); }} className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-surface-2 focus-visible:outline-2 -outline-offset-2 focus-visible:outline-ring"><td className="mono px-4 py-2.5 text-xs">#{inv.pullRequest.number}</td><td className="mono px-4 py-2.5 text-xs text-muted-foreground">{inv.repository.split("/")[1] ?? inv.repository}</td><td className="max-w-[240px] truncate px-4 py-2.5 text-xs">{inv.pullRequest.title}</td><td className="mono px-4 py-2.5 text-xs text-muted-foreground">{inv.pullRequest.author}</td><td className="px-4 py-2.5"><LevelPill level={inv.risk.level} /></td><td className="mono px-4 py-2.5 text-xs text-muted-foreground">{inv.verificationGaps} gaps</td><td className="mono px-4 py-2.5 text-xs text-muted-foreground">{inv.analyzedAt}</td><td className="px-4 py-2.5"><StatusPill status={inv.status} /></td></tr>)}</tbody></table></div>
              <ul className="divide-y divide-border md:hidden">{investigations.slice(0, 6).map((inv) => <li key={inv.id}><Link to="/investigation/$id" params={{ id: inv.id }} className="block px-4 py-3 transition-colors hover:bg-surface-2"><div className="flex items-center justify-between gap-2"><span className="mono text-xs">{inv.repository.split("/")[1] ?? inv.repository} #{inv.pullRequest.number}</span><LevelPill level={inv.risk.level} /></div><p className="mt-1 text-xs">{inv.pullRequest.title}</p><p className="mono mt-1 text-[11px] text-muted-foreground">{inv.verificationGaps} gaps · {pct(inv.risk.confidence)} confidence · {inv.analyzedAt}</p></Link></li>)}</ul>
            </>
          )}
        </section>
        <RiskDistribution distribution={metrics.riskDistribution} />
      </div>
    </div>
  </AppShell>;
}
