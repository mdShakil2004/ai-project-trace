import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { GitBranch, Github } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/trace/Primitives';
import { api } from '@/services/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const repositoriesQuery = { queryKey: ['repositories'], queryFn: () => api.listRepositories() };

export const Route = createFileRoute('/repositories/')({
  head: () => ({ meta: [{ title: 'Repositories — Trace' }, { name: 'description', content: 'Connected repositories with their investigation volume, recurring risk categories and most-touched services.' }, { property: 'og:title', content: 'Repositories — Trace' }, { property: 'og:description', content: 'Per-repository change intelligence: risk trends, hot services and open gaps.' }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(repositoriesQuery).then(() => {}),
  component: RepositoriesPage,
});

function RepositoriesPage() {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(repositoriesQuery);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const addMutation = useMutation({ mutationFn: api.addRepository, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['repositories'] }); setUrl(''); setOpen(false); } });

  return <AppShell>
    <PageHeader title="Repositories" subtitle="Repositories Trace is watching, and what its change history says about them." actions={<button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring"><Github className="size-4" aria-hidden />Add repository</button>} />
    <div className="grid gap-3 px-4 py-6 md:grid-cols-2 md:px-6 xl:grid-cols-3">
      {data.map((repo) => <Link key={repo.id} to="/repositories/$id" params={{ id: repo.id }} className="panel block p-4 transition-colors hover:border-border-strong hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring">
        <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="mono truncate text-sm">{repo.fullName}</p><p className="mono mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground"><GitBranch className="size-3" aria-hidden />{repo.defaultBranch} · {repo.language}</p></div><span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{repo.investigations} runs</span></div>
        <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center"><div><dt className="text-[10px] uppercase tracking-wide text-muted-foreground">High risk</dt><dd className="mono mt-1 text-sm tabular-nums text-risk-high">{repo.highRiskChanges}</dd></div><div><dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Gaps</dt><dd className="mono mt-1 text-sm tabular-nums text-risk-medium">{repo.verificationGaps}</dd></div><div><dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Last run</dt><dd className="mono mt-1 text-sm text-muted-foreground">{repo.lastAnalyzedAt}</dd></div></dl>
      </Link>)}
    </div>

    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Add repository</DialogTitle><DialogDescription>Connect a GitHub repository that Trace can read with the server-side GitHub token.</DialogDescription></DialogHeader><div className="space-y-2"><label htmlFor="repo-url" className="text-xs font-medium">GitHub repository URL</label><input id="repo-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/owner/repository" className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" /></div>{addMutation.error && <p className="text-xs text-risk-high">{addMutation.error.message}</p>}<DialogFooter><button type="button" onClick={() => setOpen(false)} className="rounded-md border border-border px-3 py-2 text-xs">Cancel</button><button type="button" disabled={!url.trim() || addMutation.isPending} onClick={() => addMutation.mutate(url.trim())} className="rounded-md bg-primary px-3 py-2 text-xs text-primary-foreground disabled:opacity-50">{addMutation.isPending ? 'Connecting…' : 'Connect repository'}</button></DialogFooter></DialogContent></Dialog>
  </AppShell>;
}
