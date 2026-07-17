import assert from "node:assert/strict";
import test from "node:test";
import { layoutDiagram } from "../components/diagram-layout.mjs";

const nodes = [
  { id: "author", label: "Author" },
  { id: "preview", label: "Preview" },
  { id: "export", label: "Export" },
  { id: "publish", label: "Publish" },
];

const edges = [
  { from: "author", to: "preview" },
  { from: "preview", to: "export" },
  { from: "preview", to: "publish" },
];

test("lays out diagram nodes without overlap", () => {
  const layout = layoutDiagram({ nodes, edges });

  assert.equal(layout.nodes.length, nodes.length);
  assert.equal(layout.edges.length, edges.length);
  assert.ok(layout.width > 0);
  assert.ok(layout.height > 0);

  for (const [index, node] of layout.nodes.entries()) {
    for (const other of layout.nodes.slice(index + 1)) {
      assert.ok(node.x + 208 <= other.x || other.x + 208 <= node.x || node.y + 92 <= other.y || other.y + 92 <= node.y);
    }
  }
});

test("rejects cyclic diagram edges", () => {
  assert.throws(
    () =>
      layoutDiagram({
        nodes: nodes.slice(0, 2),
        edges: [
          { from: "author", to: "preview" },
          { from: "preview", to: "author" },
        ],
      }),
    /without cycles/
  );
});

test("lays out downward diagrams without overlap", () => {
  const layout = layoutDiagram({ direction: "down", nodes, edges });

  for (const [index, node] of layout.nodes.entries()) {
    for (const other of layout.nodes.slice(index + 1)) {
      assert.ok(node.x + 208 <= other.x || other.x + 208 <= node.x || node.y + 92 <= other.y || other.y + 92 <= node.y);
    }
  }
});
