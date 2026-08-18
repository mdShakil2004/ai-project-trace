import { useState } from "react";
import { Boxes, Cloud, Cpu, Database, Server } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { blastLabel } from "@/lib/format";
import type { Architecture, ArchitectureNode, BlastLevel } from "@/types";

const nodeIcon: Record<ArchitectureNode["kind"], ComponentType<{ className?: string }>> = {
  api: Server,
  service: Boxes,
  datastore: Database,
  worker: Cpu,
  external: Cloud,
};

const blastAccent: Record<BlastLevel, string> = {
  direct: "border-risk-high/40 bg-risk-high-soft/40",
  indirect: "border-risk-medium/40 bg-risk-medium-soft/40",
  potential: "border-border-strong bg-surface-2",
};

const COL_W = 220;
const ROW_H = 116;

function nodeCenter(node: ArchitectureNode) {
  return { x: node.column * COL_W + 90, y: node.row * ROW_H + 34 };
}

export function ArchitectureMap({ architecture }: { architecture: Architecture }) {
  const [selectedId, setSelectedId] = useState<string>(architecture.nodes[1]?.id ?? "");
  const selected = architecture.nodes.find((n) => n.id === selectedId);

  const width = COL_W * 3;
  const height = ROW_H * 4;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="panel overflow-x-auto p-4">
        <div className="relative hairline-grid rounded-md" style={{ width, height }}>
          <svg
            className="pointer-events-none absolute inset-0"
            width={width}
            height={height}
            aria-hidden
          >
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="var(--border-strong)" />
              </marker>
            </defs>
            {architecture.edges.map((edge) => {
              const from = architecture.nodes.find((n) => n.id === edge.from);
              const to = architecture.nodes.find((n) => n.id === edge.to);
              if (!from || !to) return null;
              const a = nodeCenter(from);
              const b = nodeCenter(to);
              return (
                <g key={edge.id}>
                  <path
                    d={`M ${a.x} ${a.y + 24} C ${a.x} ${(a.y + b.y) / 2}, ${b.x} ${(a.y + b.y) / 2}, ${b.x} ${b.y - 24}`}
                    fill="none"
                    stroke={edge.added ? "var(--intel)" : "var(--border-strong)"}
                    strokeWidth={edge.added ? 1.5 : 1}
                    strokeDasharray={edge.added ? "4 3" : undefined}
                    markerEnd="url(#arrow)"
                  />
                  {edge.label && (
                    <text
                      x={(a.x + b.x) / 2}
                      y={(a.y + b.y) / 2}
                      textAnchor="middle"
                      className="mono"
                      fontSize="9"
                      fill="var(--muted-foreground)"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {architecture.nodes.map((node) => {
            const Icon = nodeIcon[node.kind];
            const pos = nodeCenter(node);
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedId(node.id)}
                aria-pressed={selectedId === node.id}
                className={cn(
                  "absolute flex w-[168px] -translate-x-1/2 items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                  node.changed
                    ? "border-intel/40 bg-intel-soft/40"
                    : "border-border bg-surface-2",
                  selectedId === node.id && "ring-1 ring-ring",
                )}
                style={{ left: pos.x, top: pos.y - 18 }}
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0">
                  <span className="mono block truncate text-xs">{node.label}</span>
                  <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                    {node.changed ? "changed" : node.kind}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Dashed edges were introduced by this pull request. Select a node for component detail.
        </p>
      </div>

      <aside className="panel p-4">
        {selected ? (
          <>
            <h3 className="mono text-sm">{selected.label}</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{selected.note}</p>
            <dl className="mt-4 space-y-2 text-xs">
              {[
                ["References", selected.references],
                ["Changed functions", selected.changedFunctions],
                ["Incoming dependencies", selected.incoming],
                ["Outgoing dependencies", selected.outgoing],
              ].map(([label, value]) => (
                <div key={label as string} className="flex items-center justify-between border-b border-border pb-1.5">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="mono tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Select a component.</p>
        )}
      </aside>
    </div>
  );
}

export function BlastRadius({ architecture }: { architecture: Architecture }) {
  const [openComponent, setOpenComponent] = useState<string | null>(null);
  const levels: BlastLevel[] = ["direct", "indirect", "potential"];

  return (
    <section className="panel p-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Blast radius
      </h3>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {levels.map((level) => (
          <div key={level}>
            <h4 className="flex items-center gap-2 border-b border-border pb-2 text-xs font-medium">
              <span
                className={cn(
                  "size-2 rounded-full",
                  level === "direct" && "bg-risk-high",
                  level === "indirect" && "bg-risk-medium",
                  level === "potential" && "bg-muted-foreground",
                )}
                aria-hidden
              />
              {blastLabel[level]}
            </h4>
            <ul className="mt-2 space-y-2">
              {architecture.blastRadius
                .filter((entry) => entry.level === level)
                .map((entry) => (
                  <li key={entry.component}>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenComponent((c) => (c === entry.component ? null : entry.component))
                      }
                      aria-expanded={openComponent === entry.component}
                      className={cn(
                        "w-full rounded-md border px-2.5 py-2 text-left transition-colors hover:border-border-strong focus-visible:outline-2 focus-visible:outline-ring",
                        blastAccent[level],
                      )}
                    >
                      <span className="mono text-xs">{entry.component}</span>
                      {openComponent === entry.component && (
                        <span className="mt-1.5 block text-[11px] leading-relaxed text-muted-foreground">
                          {entry.reason}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
