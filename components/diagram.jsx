import { lazy, Suspense } from "react";
import { layoutDiagram } from "./diagram-layout.mjs";

const DiagramFlow = lazy(() => import("./diagram-flow.jsx").then((module) => ({ default: module.DiagramFlow })));

export function Diagram({
  caption,
  direction = "right",
  edges = [],
  nodes = [],
  renderer = "static",
  title = "Diagram",
}) {
  if (renderer === "flow") {
    return (
      <Suspense fallback={<p className="border border-border p-4 text-muted-foreground">Loading diagram…</p>}>
        <DiagramFlow caption={caption} direction={direction} edges={edges} nodes={nodes} title={title} />
      </Suspense>
    );
  }

  if (renderer !== "static") {
    return (
      <p className="border border-destructive p-4 text-destructive">Diagram renderer must be "static" or "flow"</p>
    );
  }

  let layout;

  try {
    layout = layoutDiagram({ direction, edges, nodes });
  } catch (error) {
    return <p className="border border-destructive p-4 text-destructive">{error.message}</p>;
  }

  return (
    <figure className="my-8 overflow-hidden rounded-[var(--radius)] border border-border bg-muted/35">
      <div className="overflow-x-auto p-4 sm:p-6">
        <div className="relative" style={{ height: layout.height, width: layout.width }}>
          <svg
            aria-hidden="true"
            className="absolute inset-0 overflow-visible text-muted-foreground"
            height={layout.height}
            width={layout.width}
          >
            <defs>
              <marker id="diagram-arrow" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
                <path d="M 0 0 L 8 4 L 0 8 z" fill="currentColor" />
              </marker>
            </defs>
            {layout.edges.map((edge) => (
              <path
                d={edge.path}
                fill="none"
                key={`${edge.from}-${edge.to}`}
                markerEnd="url(#diagram-arrow)"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            ))}
          </svg>
          <ol aria-label={title} className="m-0 list-none p-0">
            {layout.nodes.map((node) => (
              <li
                className="absolute flex h-[92px] w-[208px] flex-col justify-between rounded-[var(--radius)] border border-foreground bg-card p-4 text-card-foreground shadow-[3px_3px_0_var(--border)]"
                key={node.id}
                style={{ left: node.x, top: node.y }}
              >
                <span className="font-geist-pixel text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                  {node.id}
                </span>
                <strong className="font-mondwest text-xl leading-none tracking-tight">{node.label}</strong>
                {node.detail ? <span className="text-xs text-muted-foreground">{node.detail}</span> : null}
              </li>
            ))}
          </ol>
        </div>
      </div>
      {caption ? (
        <figcaption className="border-t border-border px-5 py-3 text-sm text-muted-foreground">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
