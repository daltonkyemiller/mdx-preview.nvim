# MDX Preview component registry

Use these components from `mdx-preview/components`. They are available without an import through the MDX provider, but importing them makes the document portable and explicit.

Standard Markdown is styled to the same editorial standard as the components, so reach for a component only when it clarifies a relationship. Headings, body prose, lists, blockquotes, horizontal rules, inline code, and GFM tables (`| col | col |`) all render cleanly out of the box — a plain Markdown table is often the right call for tabular data.

The built-ins use Tailwind utilities and shared CSS variable tokens. Override the token values in a site CSS file for `:root`, `:root[data-theme="dark"]`, and the `prefers-color-scheme` system fallback, or replace a component through `mdx-preview.config.mjs`. Interactive primitives use Base UI under the same shadcn-style API. Surface tokens: `--background`, `--foreground`, `--card`, `--card-foreground`, `--border`, `--muted`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--destructive`, `--warning`, `--ring`, and `--radius` (defaults to `0` for a sharp editorial look; set e.g. `0.5rem` to round every surface at once).

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

## `Checklist`

Use for implementation steps, acceptance criteria, or review items that readers may toggle as they work.

```mdx
<Checklist
  id="release-checklist"
  title="Release readiness"
  items={[
    { id: "tests", label: "Run the test suite", checked: true },
    { id: "smoke-test", label: "Verify production", note: "Check the primary user flow after deployment." },
  ]}
/>
```

Props: `id?: string`, `title?: string`, `items: Array<{ id: string, label: string, note?: string, checked?: boolean }>`.

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

## `FileTree`

Use for a compact, navigable project tree. Paths are expanded by default, and optional Git-style change states are rendered by `@pierre/trees`.

```mdx
<FileTree
  title="Changed files"
  files={[
    { path: "components/index.jsx", change: "modified" },
    { path: "components/file-tree.jsx", change: "added" },
  ]}
/>
```

Props: `title?: string`, `height?: string`, `files: Array<{ path: string, change?: "added" | "deleted" | "modified" | "removed" | "renamed" }>`.

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

## `TableOfContents`

Use near the top of a structured plan with five or more named sections. It gives a reviewer a compact overview and in-page navigation. Give each item a short label and a stable `id`; add the same id to its matching heading. Do not use it for a short note or a document with only a few sections.

```mdx
<TableOfContents
  items={[
    { id: "scope", label: "Scope" },
    { id: "rollout", label: "Rollout" },
    { id: "risks", label: "Risks" },
  ]}
/>

<h2 id="scope">Scope</h2>
```

Props: `title?: string`, `items: Array<{ id: string, label: string }>`.

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

## `Diff`

Use to compare two versions of one file. Rendering, syntax highlighting, line wrapping, and virtualization are provided by `@pierre/diffs`.

```mdx
<Diff
  filename="components/index.jsx"
  language="jsx"
  mode="unified"
  before={`export const components = { Callout };`}
  after={`export const components = { Callout, Checklist };`}
  caption="Register the new built-in component."
/>
```

Props: `before: string`, `after: string`, `filename?: string`, `language?: string`, `mode?: "unified" | "split"`, `caption?: string`.
