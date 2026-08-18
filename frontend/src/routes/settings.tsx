import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Github, KeyRound, ExternalLink, RotateCw, AlertCircle } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/trace/Primitives';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/settings')({
  head: () => ({ meta: [{ title: 'Settings — Trace' }, { name: 'description', content: 'Manage the GitHub connection, analysis depth, risk thresholds and evidence retention for Trace.' }, { property: 'og:title', content: 'Settings — Trace' }, { property: 'og:description', content: 'Configure GitHub access, analysis depth and risk thresholds.' }] }),
  component: SettingsPage,
});

const depths = [
  { id: 'fast' as const, label: 'Fast', detail: 'Diff + PR metadata only. ~15s.' },
  { id: 'standard' as const, label: 'Standard', detail: 'Diff, issues, git history. ~45s.' },
  { id: 'deep' as const, label: 'Deep', detail: 'Adds cross-service call graph tracing. ~2m.' },
];

function SettingsPage() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({ queryKey: ['settings'], queryFn: api.getSettings });
  const githubQuery = useQuery({ queryKey: ['github-connection'], queryFn: api.getGitHubConnection, refetchOnWindowFocus: false });
  const [depth, setDepth] = useState<'fast'|'standard'|'deep'>('standard');
  const [threshold, setThreshold] = useState(60);
  const [notify, setNotify] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!settingsQuery.data) return;
    setDepth(settingsQuery.data.analysisDepth);
    setThreshold(settingsQuery.data.riskThreshold);
    setNotify(settingsQuery.data.notifyHighRisk);
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: (data) => { setSaveError(null); queryClient.setQueryData(['settings'], data); },
    onError: (error) => setSaveError(error instanceof Error ? error.message : 'Unable to save settings.'),
  });
  const rotateMutation = useMutation({
    mutationFn: api.rotateApiKey,
    onSuccess: (data) => { queryClient.setQueryData(['settings'], (old: any) => old ? { ...old, apiKeyMasked: data.masked } : old); window.prompt('Copy this Trace API key. It will not be shown again:', data.key); },
  });

  const save = (patch: Partial<{ analysisDepth: 'fast'|'standard'|'deep'; riskThreshold: number; notifyHighRisk: boolean }>) => saveMutation.mutate({ analysisDepth: patch.analysisDepth ?? depth, riskThreshold: patch.riskThreshold ?? threshold, notifyHighRisk: patch.notifyHighRisk ?? notify });

  return <AppShell>
    <PageHeader title="Settings" subtitle="Control how Trace connects to your code and how aggressively it flags risk." />
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 md:px-6">
      {(settingsQuery.isError || githubQuery.isError || saveError) && <div role="alert" className="flex items-start gap-2 rounded-lg border border-risk-high/30 bg-risk-high-soft px-3 py-2 text-xs text-risk-high"><AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden /><span>{saveError || 'Unable to load settings from the Trace backend. Check the API connection and try again.'}</span></div>}
      {saveMutation.isSuccess && !saveError && <div className="flex items-center gap-2 rounded-lg border border-risk-low/30 bg-risk-low-soft px-3 py-2 text-xs text-risk-low"><Check className="size-3.5" aria-hidden />Settings saved to the Trace backend.</div>}

      <section className="panel p-5">
        <h2 className="text-sm font-semibold">GitHub connection</h2>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-2/50 p-3">
          <div className="flex items-center gap-3"><Github className="size-4 text-muted-foreground" aria-hidden /><div><p className="mono text-xs">{githubQuery.data?.account || 'GitHub'}</p><p className="text-[11px] text-muted-foreground">{githubQuery.data?.repositoryCount ?? 0} repositories · server-side read access</p></div></div>
          {githubQuery.data?.connected ? <span className="inline-flex items-center gap-1.5 rounded border border-risk-low/30 bg-risk-low-soft px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-risk-low"><Check className="size-3" aria-hidden />Connected</span> : <span className="rounded border border-risk-high/30 bg-risk-high-soft px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-risk-high">Not connected</span>}
        </div>
        <a href={githubQuery.data?.manageUrl || 'https://github.com/settings/tokens'} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring">Manage access <ExternalLink className="size-3" aria-hidden /></a>
      </section>

      <section className="panel p-5">
        <h2 className="text-sm font-semibold">Analysis depth</h2><p className="mt-1 text-xs text-muted-foreground">Deeper analysis produces more evidence per conclusion and takes longer.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">{depths.map((d) => <button key={d.id} type="button" aria-pressed={depth===d.id} disabled={saveMutation.isPending} onClick={() => { setDepth(d.id); save({ analysisDepth: d.id }); }} className={cn('rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-ring', depth===d.id ? 'border-primary/50 bg-intel-soft/30' : 'border-border hover:bg-surface-2')}><span className="block text-xs font-medium">{d.label}</span><span className="mt-1 block text-[11px] text-muted-foreground">{d.detail}</span></button>)}</div>
      </section>

      <section className="panel p-5">
        <h2 className="text-sm font-semibold">Risk threshold</h2><p className="mt-1 text-xs text-muted-foreground">Investigations scoring at or above this value are marked as requiring review.</p>
        <div className="mt-4 flex items-center gap-4"><input type="range" min={0} max={100} value={threshold} aria-label="Risk threshold" onChange={(e) => setThreshold(Number(e.target.value))} onPointerUp={() => save({ riskThreshold: threshold })} className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-primary" /><span className="mono w-10 text-right text-sm tabular-nums">{threshold}</span></div>
      </section>

      <section className="panel p-5">
        <h2 className="text-sm font-semibold">Notifications</h2><label className="mt-3 flex items-center justify-between gap-4 text-xs"><span className="text-muted-foreground">Notify me when an analysis finds a high or critical risk</span><input type="checkbox" checked={notify} onChange={(e) => { setNotify(e.target.checked); save({ notifyHighRisk: e.target.checked }); }} className="size-4 accent-primary" /></label>
      </section>

      <section className="panel p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><KeyRound className="size-4 text-muted-foreground" aria-hidden />API access</h2><p className="mt-1 text-xs text-muted-foreground">Use the Trace API to run investigations from CI.</p>
        <div className="mt-3 flex items-center gap-2"><p className="mono min-w-0 flex-1 truncate rounded-md border border-border bg-surface-2/50 px-3 py-2 text-[11px] text-muted-foreground">{settingsQuery.data?.apiKeyMasked || 'Loading…'}</p><button type="button" onClick={() => rotateMutation.mutate()} disabled={rotateMutation.isPending} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs hover:bg-surface-2 disabled:opacity-50">{rotateMutation.isPending ? 'Rotating…' : <><RotateCw className="size-3" aria-hidden />Rotate</>}</button></div>
        <p className="mt-2 text-[10px] text-muted-foreground">The full key is shown only once when rotated.</p>
      </section>
    </div>
  </AppShell>;
}
