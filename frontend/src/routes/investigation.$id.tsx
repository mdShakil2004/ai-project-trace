import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowUpRight, FileCode2, GitCommitHorizontal, Layers, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AiConclusionCard } from "@/components/trace/AiConclusionCard";
import { ArchitectureMap, BlastRadius } from "@/components/trace/ArchitectureMap";
import { DiffViewer } from "@/components/trace/DiffViewer";
import { EvidenceCard, EvidenceDrawer } from "@/components/trace/EvidenceCard";
import { IntelligencePanel } from "@/components/trace/IntelligencePanel";
import { RiskBadge, Confidence, LevelPill } from "@/components/trace/RiskBadge";
import { RecommendedTests, VerificationMatrix } from "@/components/trace/VerificationMatrix";
import { StatusPill } from "@/components/trace/Primitives";
import { api } from "@/services/api";
import { fileStatusLabel, pct, strengthLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Evidence } from "@/types";

const investigationQuery = (id: string) => ({
  queryKey: ["investigation", id],
  queryFn: () => api.getInvestigation(id),
});

export const Route = createFileRoute("/investigation/$id")({
  loader: async ({ context, params }) => {
    try {
      const inv = await context.queryClient.ensureQueryData(investigationQuery(params.id));
      return { title: inv.pullRequest.title, repository: inv.repository, headline: inv.headline };
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Investigation unavailable — Trace" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.repository}: ${loaderData.title} — Trace`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.headline },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.headline },
      ],
    };
  },
  notFoundComponent: InvestigationNotFound,
  component: InvestigationPage,
});

function InvestigationNotFound() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-center">
        <h1 className="text-lg font-semibold">Investigation not found</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          This investigation ID doesn&apos;t exist or has been removed. Browse recent investigations instead.
        </p>
        <Link
          to="/investigations"
          className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
        >
          View investigations
        </Link>
      </div>
    </AppShell>
  );
}


const TABS = [
  "Overview",
  "What Changed",
  "Why",
  "Architecture",
  "Risk",
  "Verification",
  "Evidence",
  "Files",
] as const;

function InvestigationPage() {
  const { id } = Route.useParams();
  const { data: inv } = useSuspenseQuery(investigationQuery(id));
  const [tab, setTab] = useState<string>("Overview");
  const [evidence, setEvidence] = useState<Evidence | null>(null);

  const openEvidenceById = (evidenceId: string) => {
    const found = inv.evidence.find((e) => e.id === evidenceId);
    if (found) setEvidence(found);
  };

  return (
    <AppShell>
      <header className="border-b border-border px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <Link to="/investigations" className="hover:text-foreground">
            Investigations
          </Link>
          <span aria-hidden>/</span>
          <span className="mono">{inv.repository}</span>
          <span aria-hidden>/</span>
          <span className="mono">#{inv.pullRequest.number}</span>
        </div>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight">{inv.pullRequest.title}</h1>
            <p className="mono mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span>{inv.pullRequest.author}</span>
              <span>
                {inv.pullRequest.headBranch} → {inv.pullRequest.baseBranch}
              </span>
              <span className="text-risk-low">+{inv.pullRequest.additions}</span>
              <span className="text-risk-high">−{inv.pullRequest.deletions}</span>
              <span>analyzed in {inv.analysisSeconds}s</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={inv.status} />
            <RiskBadge level={inv.risk.level} size="md" />
            <a
              href={inv.pullRequest.url}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring"
            >
              Open on GitHub
              <ArrowUpRight className="size-3" aria-hidden />
            </a>
          </div>
        </div>

        <nav
          aria-label="Investigation sections"
          className="mt-4 -mb-4 flex gap-1 overflow-x-auto pb-0"
        >
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              aria-current={tab === t ? "page" : undefined}
              onClick={() => setTab(t)}
              className={cn(
                "whitespace-nowrap border-b-2 px-3 py-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                tab === t
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      <div className="grid gap-4 px-4 py-6 md:px-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-4">
          {tab === "Overview" && (
            <>
              <section className="panel p-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="size-4 text-intel" aria-hidden />
                  {inv.headline}
                </h2>
                <ul className="mt-4 space-y-2">
                  {inv.executiveSummary.map((line) => (
                    <li key={line} className="flex gap-2 text-sm leading-relaxed text-foreground/90">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
                      {line}
                    </li>
                  ))}
                </ul>
                <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
                  {[
                    ["Files changed", inv.filesChanged],
                    ["Services affected", inv.servicesAffected],
                    ["New dependencies", inv.newDependencies],
                    ["Verification gaps", inv.verificationGaps],
                  ].map(([label, value]) => (
                    <div key={String(label)}>
                      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {label}
                      </dt>
                      <dd className="mono mt-1 text-lg tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="panel p-4">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Primary concern
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <LevelPill level={inv.risk.level} />
                  <p className="min-w-0 flex-1 text-sm">{inv.risk.primaryConcern}</p>
                  <Confidence value={inv.risk.confidence} />
                </div>
              </section>

              <AiConclusionCard
                conclusion={inv.architecture.conclusion}
                evidence={inv.evidence}
                onEvidenceClick={openEvidenceById}
              />
            </>
          )}

          {tab === "What Changed" && (
            <section className="space-y-3">
              {inv.changes.map((change) => (
                <article key={change.id} className="panel p-4">
                  <header className="flex flex-wrap items-center gap-2">
                    <GitCommitHorizontal className="size-3.5 text-muted-foreground" aria-hidden />
                    <h3 className="text-sm font-medium">{change.title}</h3>
                    <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {change.kind}
                    </span>
                  </header>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {change.detail}
                  </p>
                  <div className="mono mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    {change.files.map((f) => (
                      <span key={f} className="rounded bg-surface-2 px-1.5 py-0.5">
                        {f}
                      </span>
                    ))}
                  </div>
                  {change.evidenceIds.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {change.evidenceIds.map((eid) => (
                        <button
                          key={eid}
                          type="button"
                          onClick={() => openEvidenceById(eid)}
                          className="mono rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                        >
                          {eid}
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </section>
          )}

          {tab === "Why" && (
            <section className="space-y-4">
              <div className="panel p-5">
                <h2 className="text-sm font-semibold">{inv.why.question}</h2>
                <ol className="mt-4 space-y-4 border-l border-border pl-5">
                  {inv.why.chain.map((step) => (
                    <li key={step.id} className="relative">
                      <span
                        className="absolute -left-[23px] top-1.5 size-2 rounded-full bg-intel"
                        aria-hidden
                      />
                      <div className="mono flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{step.ref}</span>
                        <span>{step.date}</span>
                      </div>
                      <p className="mt-1 text-sm font-medium">{step.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {step.detail}
                      </p>
                      {step.evidenceId && (
                        <button
                          type="button"
                          onClick={() => openEvidenceById(step.evidenceId!)}
                          className="mono mt-2 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                        >
                          {step.evidenceId}
                        </button>
                      )}
                    </li>
                  ))}
                </ol>
              </div>

              <AiConclusionCard
                conclusion={{
                  title: "Interpretation",
                  confidence: inv.why.confidence,
                  statement: inv.why.interpretation,
                  evidenceIds: inv.why.chain.flatMap((s) => (s.evidenceId ? [s.evidenceId] : [])),
                  unknowns: inv.why.unknowns,
                }}
                evidence={inv.evidence}
                onEvidenceClick={openEvidenceById}
              />
              <p className="text-[11px] text-muted-foreground">
                Evidence strength: {strengthLabel[inv.why.evidenceStrength]} ·{" "}
                {pct(inv.why.confidence)} confidence
              </p>
            </section>
          )}

          {tab === "Architecture" && (
            <section className="space-y-4">
              <ArchitectureMap architecture={inv.architecture} />
              <BlastRadius architecture={inv.architecture} />
              <AiConclusionCard
                conclusion={inv.architecture.conclusion}
                evidence={inv.evidence}
                onEvidenceClick={openEvidenceById}
              />
            </section>
          )}

          {tab === "Risk" && (
            <section className="space-y-3">
              {inv.risks.map((risk) => (
                <article key={risk.id} className="panel p-4">
                  <header className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium">{risk.title}</h3>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {risk.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <RiskBadge level={risk.level} />
                      <Confidence value={risk.confidence} />
                    </div>
                  </header>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {risk.description}
                  </p>
                  <div className="mono mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    {risk.locations.map((loc) => (
                      <span
                        key={`${loc.file}:${loc.line}`}
                        className="rounded bg-surface-2 px-1.5 py-0.5"
                      >
                        {loc.file}:{loc.line}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 rounded-md border border-border bg-surface-2/50 p-3 text-xs leading-relaxed">
                    <span className="font-medium">Mitigation · </span>
                    {risk.mitigation}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {risk.evidenceIds.map((eid) => (
                      <button
                        key={eid}
                        type="button"
                        onClick={() => openEvidenceById(eid)}
                        className="mono rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        {eid}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </section>
          )}

          {tab === "Verification" && (
            <section className="space-y-4">
              <VerificationMatrix checks={inv.verification.checks} />
              <RecommendedTests recommended={inv.verification.recommended} />
              <AiConclusionCard
                conclusion={inv.verification.conclusion}
                evidence={inv.evidence}
                onEvidenceClick={openEvidenceById}
              />
            </section>
          )}

          {tab === "Evidence" && (
            <section className="grid gap-3 md:grid-cols-2">
              {inv.evidence.map((item, i) => (
                <EvidenceCard key={item.id} evidence={item} index={i} onOpen={setEvidence} />
              ))}
            </section>
          )}

          {tab === "Files" && (
            <section className="space-y-3">
              <div className="panel flex flex-wrap items-center gap-3 px-4 py-3 text-xs text-muted-foreground">
                <FileCode2 className="size-3.5" aria-hidden />
                <span className="mono">{inv.files.length} files changed</span>
                {inv.files.map((f) => (
                  <span key={f.path} className="mono">
                    {fileStatusLabel[f.status]}
                  </span>
                ))}
              </div>
              {inv.files.map((file, i) => (
                <DiffViewer
                  key={file.path}
                  file={file}
                  defaultOpen={i === 0}
                  onExplain={() => setTab("What Changed")}
                />
              ))}
            </section>
          )}
        </div>

        <aside className="min-w-0 xl:sticky xl:top-4 xl:self-start">
          <IntelligencePanel
            investigation={inv}
            onTabChange={setTab}
            onEvidenceOpen={setEvidence}
          />
          <div className="panel mt-4 p-4">
            <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Layers className="size-3.5" aria-hidden />
              Investigation metadata
            </h2>
            <dl className="mono mt-3 space-y-1.5 text-[11px]">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Opened</dt>
                <dd>{inv.pullRequest.openedAt}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Analyzed</dt>
                <dd>{inv.analyzedAt}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Checks</dt>
                <dd>{inv.verificationChecks}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Risks</dt>
                <dd>{inv.riskCount}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>

      <EvidenceDrawer evidence={evidence} onOpenChange={(open) => !open && setEvidence(null)} />
    </AppShell>
  );
}
