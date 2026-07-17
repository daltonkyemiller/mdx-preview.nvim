# MDX Preview component registry

Use these components from `mdx-preview/components`. They are available without an import through the MDX provider, but importing them makes the document portable and explicit.

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

## `CodeBlock`

Use for a short, focused code or configuration excerpt.

```mdx
<CodeBlock language="js" title="mdx-preview.config.mjs">
  export default {"{"} components: [] {"}"}
</CodeBlock>
```

Props: `language?: string`, `title?: string`, `children: string`.
