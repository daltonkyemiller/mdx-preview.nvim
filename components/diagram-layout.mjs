import dagre from "@dagrejs/dagre";

const NODE_HEIGHT = 92;
const NODE_WIDTH = 208;
const PADDING = 28;

const validateDiagram = (nodes, edges) => {
  const identifiers = new Set();

  for (const node of nodes) {
    if (!node?.id || !node?.label) {
      throw new Error("Each diagram node needs an id and label");
    }

    if (identifiers.has(node.id)) {
      throw new Error(`Diagram node ids must be unique: ${node.id}`);
    }

    identifiers.add(node.id);
  }

  for (const edge of edges) {
    if (!identifiers.has(edge.from) || !identifiers.has(edge.to)) {
      throw new Error(`Diagram edge ${edge.from} → ${edge.to} references an unknown node`);
    }
  }
};

const hasCycle = (nodes, edges) => {
  const children = new Map(nodes.map((node) => [node.id, []]));
  const visiting = new Set();
  const visited = new Set();

  for (const edge of edges) {
    children.get(edge.from).push(edge.to);
  }

  const visit = (nodeId) => {
    if (visiting.has(nodeId)) {
      return true;
    }

    if (visited.has(nodeId)) {
      return false;
    }

    visiting.add(nodeId);
    const containsCycle = children.get(nodeId).some(visit);
    visiting.delete(nodeId);
    visited.add(nodeId);
    return containsCycle;
  };

  return nodes.some((node) => visit(node.id));
};

const edgePath = (points) => points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

export const layoutDiagram = ({ direction = "right", edges = [], nodes = [] }) => {
  if (!Array.isArray(nodes) || !Array.isArray(edges) || nodes.length < 2) {
    throw new Error("Diagram needs at least two nodes and an edges array");
  }

  if (direction !== "right" && direction !== "down") {
    throw new Error('Diagram direction must be "right" or "down"');
  }

  validateDiagram(nodes, edges);
  if (hasCycle(nodes, edges)) {
    throw new Error("Diagram edges must form a directed flow without cycles");
  }

  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    marginx: PADDING,
    marginy: PADDING,
    nodesep: 52,
    rankdir: direction === "down" ? "TB" : "LR",
    ranksep: 120,
    ranker: "network-simplex",
  });

  for (const node of nodes) {
    graph.setNode(node.id, { height: NODE_HEIGHT, width: NODE_WIDTH });
  }

  for (const edge of edges) {
    graph.setEdge(edge.from, edge.to);
  }

  dagre.layout(graph);

  return {
    edges: edges.map((edge) => {
      const graphEdge = graph.edge(edge.from, edge.to);
      return { ...edge, path: edgePath(graphEdge.points), points: graphEdge.points };
    }),
    height: graph.graph().height,
    nodes: nodes.map((node) => {
      const position = graph.node(node.id);
      return { ...node, x: position.x - NODE_WIDTH / 2, y: position.y - NODE_HEIGHT / 2 };
    }),
    width: graph.graph().width,
  };
};
