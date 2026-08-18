import { Calendar, Code2, FileText, GitCommit, GitPullRequest, MessageSquare, TestTube2, User } from "lucide-react";
import type { ComponentType } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { evidenceKindLabel, strengthLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Evidence, EvidenceKind } from "@/types";

export const evidenceIcon: Record<EvidenceKind, ComponentType<{ className?: string }>> = {
  pull_request: GitPullRequest,
  issue: MessageSquare,
  commit: GitCommit,
  code: Code2,
  docs: FileText,
  test: TestTube2,
};

const strengthClass: Record<Evidence["strength"], string> = {
  direct: "border-risk-low/30 bg-risk-low-soft text-risk-low",
  strong: "border-intel/30 bg-intel-soft text-intel",
  moderate: "border-border-strong bg-surface-2 text-muted-foreground",
  weak: "border-border bg-surface-2 text-muted-foreground",
};

export function EvidenceCard({
  evidence,
  index,
  onOpen,
}: {
  evidence: Evidence;
  index?: number;
  onOpen: (evidence: Evidence) => void;
}) {
  const Icon = evidenceIcon[evidence.kind];
  return (
    <button
      type="button"
      onClick={() => onOpen(evidence)}
      className="group block w-full rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded border border-border bg-surface-2">
            <Icon className="size-3.5 text-muted-foreground" aria-hidden />
          </span>
          <div>
            <div className="mono text-xs text-foreground">{evidence.ref}</div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {evidenceKindLabel[evidence.kind]}
              {index !== undefined && ` · Evidence #${index + 1}`}
            </div>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
            strengthClass[evidence.strength],
          )}
        >
          {strengthLabel[evidence.strength]}
        </span>
      </div>

      <p className="mt-3 text-sm font-medium text-foreground">{evidence.title}</p>
      <p className="mono mt-2 line-clamp-2 whitespace-pre-wrap text-[11.5px] leading-relaxed text-muted-foreground">
        {evidence.excerpt}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <User className="size-3" aria-hidden />
          {evidence.author}
        </span>
        <span className="inline-flex items-center gap-1">
          <Calendar className="size-3" aria-hidden />
          {evidence.date}
        </span>
        {evidence.file && <span className="mono truncate">{evidence.file}</span>}
      </div>
    </button>
  );
}

export function EvidenceDrawer({
  evidence,
  onOpenChange,
}: {
  evidence: Evidence | null;
  onOpenChange: (open: boolean) => void;
}) {
  const Icon = evidence ? evidenceIcon[evidence.kind] : Code2;
  return (
    <Sheet open={Boolean(evidence)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto bg-surface sm:max-w-xl">
        {evidence && (
          <>
            <SheetHeader className="space-y-2">
              <SheetTitle className="flex items-center gap-2 text-base">
                <Icon className="size-4 text-muted-foreground" aria-hidden />
                <span className="mono">{evidence.ref}</span>
              </SheetTitle>
              <SheetDescription>{evidence.title}</SheetDescription>
            </SheetHeader>

            <div className="space-y-5 px-4 pb-8">
              <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-surface-2/50 p-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Source</dt>
                  <dd className="mono mt-0.5">{evidence.source}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Kind</dt>
                  <dd className="mt-0.5">{evidenceKindLabel[evidence.kind]}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Author</dt>
                  <dd className="mono mt-0.5">{evidence.author}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Date</dt>
                  <dd className="mono mt-0.5">{evidence.date}</dd>
                </div>
                {evidence.file && (
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">File</dt>
                    <dd className="mono mt-0.5 break-all">
                      {evidence.file}
                      {evidence.lines && `:${evidence.lines[0]}-${evidence.lines[1]}`}
                    </dd>
                  </div>
                )}
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Relevance</dt>
                  <dd className="mt-1">
                    <span
                      className={cn(
                        "rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                        strengthClass[evidence.strength],
                      )}
                    >
                      {strengthLabel[evidence.strength]}
                    </span>
                  </dd>
                </div>
              </dl>

              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Relevant excerpt
                </h4>
                <pre className="mono mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-3 text-[12px] leading-relaxed">
                  {evidence.excerpt}
                </pre>
              </div>

              {evidence.url && (
                <a
                  href={evidence.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs transition-colors hover:bg-surface-2"
                >
                  Open source on GitHub
                </a>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
