import { Background, Controls, Handle, MarkerType, Position, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { layoutDiagram } from "./diagram-layout.mjs";

const nodeTypes = {
  diagram: ({ data }) => (
    <div className="flex h-[92px] w-[208px] flex-col justify-between border border-foreground bg-card p-4 text-card-foreground shadow-[4px_4px_0_var(--border)]">
      <Handle
        className="size-1 border-0 bg-transparent"
        position={data.isVertical ? Position.Top : Position.Left}
        type="target"
      />
      <span className="font-geist-pixel text-[10px] tracking-[0.16em] text-muted-foreground uppercase">{data.id}</span>
      <strong className="font-mondwest text-xl leading-none tracking-tight">{data.label}</strong>
      {data.detail ? <span className="text-xs text-muted-foreground">{data.detail}</span> : null}
      <Handle
        className="size-1 border-0 bg-transparent"
        position={data.isVertical ? Position.Bottom : Position.Right}
        type="source"
      />
    </div>
  ),
};

export function DiagramFlow({ caption, direction = "right", edges = [], nodes = [], title = "Diagram" }) {
  let layout;

  try {
    layout = layoutDiagram({ direction, edges, nodes });
  } catch (error) {
    return <p className="border border-destructive p-4 text-destructive">{error.message}</p>;
  }

  const isVertical = direction === "down";
  const sourcePosition = isVertical ? Position.Bottom : Position.Right;
  const targetPosition = isVertical ? Position.Top : Position.Left;
  const flowNodes = layout.nodes.map((node) => ({
    data: { ...node, isVertical },
    id: node.id,
    position: { x: node.x, y: node.y },
    sourcePosition,
    targetPosition,
    type: "diagram",
  }));
  const flowEdges = layout.edges.map((edge) => ({
    id: `${edge.from}-${edge.to}`,
    markerEnd: { color: "var(--muted-foreground)", type: MarkerType.ArrowClosed },
    source: edge.from,
    style: { stroke: "var(--muted-foreground)", strokeWidth: 1.5 },
    target: edge.to,
    type: "smoothstep",
  }));

  return (
    <figure className="my-8 overflow-hidden border border-border bg-muted/35">
      <div aria-label={title} className="h-[28rem] min-h-[20rem]" role="img">
        <ReactFlow
          edges={flowEdges}
          fitView
          fitViewOptions={{ maxZoom: 1, padding: 0.22 }}
          maxZoom={1.8}
          minZoom={0.35}
          nodes={flowNodes}
          nodeTypes={nodeTypes}
          nodesConnectable={false}
          nodesDraggable={false}
          nodesFocusable={false}
          panOnDrag
          proOptions={{ hideAttribution: true }}
          zoomOnDoubleClick={false}
        >
          <Background color="var(--border)" gap={24} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      {caption ? (
        <figcaption className="border-t border-border px-5 py-3 text-sm text-muted-foreground">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
