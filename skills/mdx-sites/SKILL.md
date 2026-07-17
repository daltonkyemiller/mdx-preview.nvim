---
name: mdx-sites
description: Create, revise, preview, build, and publish local MDX sites, visual plans, implementation proposals, diagrams, and shareable HTML artifacts with mdx-preview. Use when an agent should write a durable MDX artifact instead of an inline plan, needs component-backed visual documentation, needs to preview or export an MDX site, or needs to publish a static artifact through Here Now.
---

# MDX Sites

Create durable source artifacts, not chat-only plans. Keep plan content in local MDX and use the project component registry before inventing layout markup.

## Workflow

1. Inspect the target project before writing a plan. Name actual files, symbols, and decisions.
2. Choose a checked-in `plans/<slug>/` folder unless the user asks for temporary output. Create it with:

   ```sh
   pnpm exec mdx-preview new <slug> --out plans --title "Plan title"
   ```

3. Read `references/components.md`, then use the smallest set of components that clarifies the artifact. Do not pad a plan with decorative metrics or diagrams.
4. Write `index.mdx`. Use MDX imports and exports at the top level. Export local React components rather than declaring bare functions.
5. Preview with `pnpm exec mdx-preview serve plans/<slug> --open`.
6. Build a shareable static directory with `pnpm exec mdx-preview build plans/<slug> --out dist/<slug>`.
7. Publish only when asked, using `pnpm exec mdx-preview publish plans/<slug> --out dist/<slug>`. This reads `HERENOW_API_KEY` when present; otherwise it creates a 24-hour anonymous site and prints its claim URL.

## Component registry

Run `pnpm exec mdx-preview components list` for the installed registry. Read `references/components.md` for usage guidance.

For project-specific components, create `mdx-preview.config.mjs` beside the MDX site or in an ancestor directory:

```js
export default {
  components: [
    {
      name: "ArchitectureMap",
      module: "./components/architecture-map.tsx",
      export: "ArchitectureMap",
      description: "Show service ownership and dependencies.",
      when: "Use for system boundaries with multiple services.",
    },
  ],
};
```

Add a `description`, `when`, props, and an example to the project's own agent instructions or component reference. Agents need usage intent, not only a component name.

## Site discipline

- Keep standard Markdown as the default. Use React components only when they clarify a relationship, comparison, state, or interaction.
- Use `Flow` for sequence, `Architecture` for ownership, `Comparison` for two alternatives, and `FileMap` for multi-file change surfaces.
- Build a static directory as the canonical export. Use `--single-file` only when a recipient explicitly needs one HTML file.
- Do not publish private material without explicit approval. Keep `.herenow/` out of source control.
