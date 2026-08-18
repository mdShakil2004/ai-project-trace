import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChangedFile, DiffLine } from "@/types";

const KEYWORDS =
  /\b(async|await|const|let|var|return|if|else|switch|case|break|new|export|import|from|class|function|throw|try|catch|expect|test|describe|it|not|null|true|false|number|string)\b/g;

function highlight(content: string) {
  const escaped = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped
    .replace(/(\/\/.*$)/g, '<span class="text-muted-foreground italic">$1</span>')
    .replace(/(`[^`]*`|'[^']*'|"[^"]*")/g, '<span class="text-risk-low">$1</span>')
    .replace(KEYWORDS, '<span class="text-intel">$&</span>')
    .replace(/\b(\d+)\b/g, '<span class="text-risk-medium">$1</span>');
}

function DiffRow({ line, onSelect, selected }: { line: DiffLine; onSelect: () => void; selected: boolean }) {
  return (
    <tr
      onClick={onSelect}
      className={cn(
        "group cursor-pointer",
        line.type === "add" && "bg-diff-add-soft/60",
        line.type === "del" && "bg-diff-del-soft/60",
        selected && "outline outline-1 -outline-offset-1 outline-ring",
      )}
    >
      <td className="w-10 select-none border-r border-border px-2 text-right text-[11px] text-muted-foreground/60">
        {line.oldLine ?? ""}
      </td>
      <td className="w-10 select-none border-r border-border px-2 text-right text-[11px] text-muted-foreground/60">
        {line.newLine ?? ""}
      </td>
      <td
        className={cn(
          "w-5 select-none text-center text-[11px]",
          line.type === "add" && "text-diff-add",
          line.type === "del" && "text-diff-del",
        )}
      >
        {line.type === "add" ? "+" : line.type === "del" ? "−" : ""}
      </td>
      <td className="whitespace-pre px-2 text-[12.5px] leading-[1.6]">
        <span dangerouslySetInnerHTML={{ __html: highlight(line.content) || "&nbsp;" }} />
      </td>
    </tr>
  );
}

export function DiffViewer({
  file,
  onExplain,
  defaultOpen = true,
}: {
  file: ChangedFile;
  onExplain?: (file: ChangedFile) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [selected, setSelected] = useState<string | null>(null);
  const total = useMemo(
    () => file.hunks.reduce((acc, hunk) => acc + hunk.lines.length, 0),
    [file.hunks],
  );

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2/60 px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 text-left focus-visible:outline-2 focus-visible:outline-ring"
        >
          {open ? (
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          ) : (
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          )}
          <span className="mono truncate text-xs">{file.path}</span>
        </button>
        <span className="mono text-[11px] text-diff-add">+{file.additions}</span>
        <span className="mono text-[11px] text-diff-del">−{file.deletions}</span>
        <span className="mono text-[11px] text-muted-foreground">{total} lines</span>
        {onExplain && (
          <button
            type="button"
            onClick={() => onExplain(file)}
            className="inline-flex items-center gap-1.5 rounded-md border border-intel/40 bg-intel-soft/40 px-2 py-1 text-[11px] font-medium text-intel transition-colors hover:bg-intel-soft focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Sparkles className="size-3" aria-hidden />
            Explain this change
          </button>
        )}
      </div>

      {open && (
        <div className="overflow-x-auto">
          <table className="mono w-full border-collapse text-left">
            <tbody>
              {file.hunks.map((hunk) => (
                <Fragment key={hunk.header}>
                  <tr>
                    <td
                      colSpan={4}
                      className="mono border-y border-border bg-surface-2/40 px-3 py-1 text-[11px] text-muted-foreground"
                    >
                      {hunk.header}
                    </td>
                  </tr>
                  {hunk.lines.map((line, i) => {
                    const key = `${hunk.header}-${i}`;
                    return (
                      <DiffRow
                        key={key}
                        line={line}
                        selected={selected === key}
                        onSelect={() => setSelected((s) => (s === key ? null : key))}
                      />
                    );
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
