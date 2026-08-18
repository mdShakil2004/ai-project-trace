import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, GitBranch } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MetricCard, PageHeader, RiskDistribution, StatusPill } from "@/components/trace/Primitives";
import { LevelPill } from "@/components/trace/RiskBadge";
import { api } from "@/services/api";

const repoQuery = (id: string) => ({ queryKey: ["repository", id], queryFn: () => api.getRepository(id) });
const investigationsQuery = { queryKey: ["investigations"], queryFn: () => api.listInvestigations() };

export const Route = createFileRoute("/repositories/$id")({
  loader: async ({ context, params }) => {
    const repo = await context.queryClient.ensureQueryData(repoQuery(params.id));
    await context.queryClient.ensureQueryData(investigationsQuery);
    return { name: repo.fullName };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.name ?? "Repository";
    return { meta: [
      { title: `${name} — Trace repository intelligence` },
      { name: "description", content: `Change intelligence for ${name}: risk distribution, recurring risk categories, most-touched services and recent investigations.` },
      { property: "og:title", content: `${name} — Trace` },
      { property: "og:description", content: `Risk trends and recent change investigations for ${name}.` },
    ] };
  },
  component: RepositoryPage,
});

function RepositoryPage() {
  const { id } = Route.useParams();
  const { data: repo } = useSuspenseQuery(repoQuery(id));
  const { data: investigations } = useSuspenseQuery(investigationsQuery);
  const rows = investigations.filter((inv) => inv.repositoryId === repo.id);

  return (
    <AppShell>
      <PageHeader title={repo.fullName} subtitle={`${repo.language} · default branch ${repo.defaultBranch} · last analyzed ${repo.lastAnalyzedAt}`} actions={<Link to="/repositories" className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring"><ArrowLeft className="size-3.5" aria-hidden />All repositories</Link>} />
      <div className="space-y-6 px-4 py-6 md:px-6">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Investigations" value={repo.investigations} delta="all time" /><MetricCard label="High-risk changes" value={repo.highRiskChanges} delta="flagged for review" tone="warning" /><MetricCard label="Verification gaps" value={repo.verificationGaps} delta="open across PRs" tone="warning" /><MetricCard label="Primary language" value={repo.language} delta={repo.defaultBranch} /></section>
        <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
          <div className="space-y-4">
            <RiskDistribution distribution={repo.riskDistribution} />
            <section className="panel p-4"><h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Most-touched services</h2>{repo.frequentServices.length === 0 ? <p className="mt-3 text-xs text-muted-foreground">No service patterns recorded yet.</p> : <ul className="mt-3 space-y-2">{repo.frequentServices.map((s) => <li key={s.name} className="flex items-center justify-between text-xs"><span className="mono truncate">{s.name}</span><span className="mono tabular-nums text-muted-foreground">{s.touches}</span></li>)}</ul>}</section>
            <section className="panel p-4"><h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recurring risk categories</h2>{repo.commonRiskCategories.length === 0 ? <p className="mt-3 text-xs text-muted-foreground">No risk patterns recorded yet.</p> : <ul className="mt-3 space-y-2">{repo.commonRiskCategories.map((c) => <li key={c.name} className="flex items-center justify-between text-xs"><span className="truncate">{c.name}</span><span className="mono tabular-nums text-muted-foreground">{c.count}</span></li>)}</ul>}</section>
          </div>
          <section className="panel overflow-hidden"><header className="flex items-center gap-2 border-b border-border px-4 py-3"><GitBranch className="size-3.5 text-muted-foreground" aria-hidden /><h2 className="text-sm font-semibold">Recent investigations</h2></header>{rows.length === 0 ? <p className="px-4 py-8 text-center text-xs text-muted-foreground">No investigations recorded for this repository yet.</p> : <ul className="divide-y divide-border">{rows.map((inv) => <li key={inv.id}><Link to="/investigation/$id" params={{ id: inv.id }} className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2 focus-visible:outline-2 -outline-offset-2 focus-visible:outline-ring"><span className="mono text-xs text-muted-foreground">#{inv.pullRequest.number}</span><span className="min-w-0 flex-1 truncate text-xs">{inv.pullRequest.title}</span><LevelPill level={inv.risk.level} /><StatusPill status={inv.status} /><span className="mono text-[11px] text-muted-foreground">{inv.analyzedAt}</span></Link></li>)}</ul>}</section>
        </div>
      </div>
    </AppShell>
  );
}
