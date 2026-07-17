# MDX Preview component registry

Use these components from `mdx-preview/components`. They are available without an import through the MDX provider, but importing them makes the document portable and explicit.

The built-ins use Tailwind utilities and shared CSS variable tokens. Override the token values in a site CSS file for `:root`, `:root[data-theme="dark"]`, and the `prefers-color-scheme` system fallback, or replace a component through `mdx-preview.config.mjs`. Interactive primitives use Base UI under the same shadcn-style API.

## `Button`

Use for a real local interaction, such as revealing detail or navigating within a generated MDX app. Do not use a button for a normal external link.

```mdx
<Button variant="outline" onClick={() => console.log("Saved")}>
  Save draft
</Button>
```

Props: Base UI button props, plus `variant?: "default" | "outline" | "quiet"` and `size?: "default" | "small" | "icon"`.

## `Callout`

Use for a note, warning, risk, or bounded piece of supporting context.

```mdx
<Callout title="Scope" tone="warning">
  This does not load a project's Tailwind theme.
</Callout>
```

Props: `title?: string`, `tone?: "info" | "warning" | "danger"`.

## `Flow`

Use for three or more ordered steps, handoffs, or dependent events.

```mdx
<Flow steps={[{ title: "Draft", detail: "Write the MDX plan." }, { title: "Review" }, { title: "Build" }]} />
```

Props: `steps: Array<{ title: string, detail?: string }>`.

## `Comparison`

Use to show two approaches with equal weight.

```mdx
<Comparison
  left={{ label: "Now", title: "Manual", detail: "One-off HTML." }}
  right={{ label: "Next", title: "MDX site", detail: "Reusable components." }}
/>
```

Props: `left`, `right`, each with `label`, `title`, and `detail`.

## `FileMap`

Use when a plan changes three or more files or folders.

```mdx
<FileMap files={[{ path: "server/build.mjs", detail: "Static build entry." }]} />
```

Props: `files: Array<{ path: string, detail?: string }>`.

## `Decision`

Use for a recommended technical or product decision with rationale.

```mdx
<Decision
  status="Recommended"
  title="Build static files first"
  rationale="A deployable directory is more reliable than forced single-file output."
/>
```

Props: `status?: string`, `title: string`, `rationale: string`.

## `Timeline`

Use for phases, milestones, or ordered delivery work.

```mdx
<Timeline events={[{ label: "Phase 1", title: "CLI", detail: "Serve and build." }]} />
```

Props: `events: Array<{ label: string, title: string, detail?: string }>`.

## `Metric`

Use for one meaningful number. Do not use it as decorative filler.

```mdx
<Metric label="Preview startup" value="<1s" detail="Local Vite server." />
```

Props: `label: string`, `value: string`, `detail?: string`.

## `Architecture`

Use for a small set of connected system layers. Use `Flow` when order matters more than ownership.

```mdx
<Architecture
  nodes={[
    { label: "Authoring", title: "MDX" },
    { label: "Runtime", title: "Vite" },
  ]}
/>
```

Props: `nodes: Array<{ label: string, title: string, detail?: string }>`.

## `Diagram`

Use when the direction of a handoff or dependency is the point. Nodes are laid out automatically; do not provide coordinates.

```mdx
<Diagram
  title="Document lifecycle"
  nodes={[
    { id: "author", label: "Author", detail: "MDX source" },
    { id: "preview", label: "Preview", detail: "Local browser" },
    { id: "export", label: "Export", detail: "Static HTML" },
  ]}
  edges={[
    { from: "author", to: "preview" },
    { from: "preview", to: "export" },
  ]}
/>
```

Props: `nodes: Array<{ id: string, label: string, detail?: string }>`, `edges: Array<{ from: string, to: string }>`, `direction?: "right" | "down"`, `renderer?: "static" | "flow"`, `title?: string`, `caption?: string`.

`renderer="static"` is the default: a compact fixed diagram suited to static documents. Use `renderer="flow"` when the reader benefits from pan, zoom, and a fit-view control. Flow mode uses Dagre for automatic layout and React Flow for rendering, but stays read-only.

Use no more than eight nodes and twelve edges. Keep labels short, use a directed acyclic flow, and split unrelated systems into separate diagrams. Use `Flow` when the reader only needs a linear sequence; use `Architecture` when ownership matters more than the arrows.

## `CodeBlock`

Use for a short, focused code or configuration excerpt.

```mdx
<CodeBlock language="js" title="mdx-preview.config.mjs">
  export default {"{"} components: [] {"}"}
</CodeBlock>
```

Props: `language?: string`, `title?: string`, `children: string`.
