# mdx-preview.nvim

`mdx-preview.nvim` is a local MDX-site toolkit with a Neovim entry point. Use it to preview Markdown and MDX, generate visual plans as local files, build static sites, and publish a finished artifact.

React imports resolve relative to the MDX document. Tailwind v4 utilities and the built-in visual component registry work without adding a separate site app to each project.

## Install

Requirements: Neovim 0.10+, Node.js 20+, and pnpm 11.

With [lazy.nvim](https://github.com/folke/lazy.nvim):

```lua
{
  "daltonkyemiller/mdx-preview.nvim",
  build = "pnpm install --frozen-lockfile",
  config = function()
    require("mdx-preview").setup()
  end,
}
```

For a manual install, run `pnpm install --frozen-lockfile` in the plugin checkout.

## Neovim

```lua
require("mdx-preview").setup({
  port = 4321,
  open_browser = true,
  follow_buffer = true,
})
```

- `:MdxPreview` starts the local server and renders the current `.md` or `.mdx` file.
- `:MdxPreviewStop` stops it.

When `follow_buffer` is enabled, entering another Markdown or MDX buffer changes the existing browser preview. Saving the document refreshes it.

## Standalone CLI

Use the CLI without Neovim from this checkout:

```sh
pnpm mdx-preview serve path/to/site --open
pnpm mdx-preview build path/to/site --out dist/site
pnpm mdx-preview build path/to/site --out dist/site --single-file
```

To use it from any directory, register the local binary once:

```sh
cd ~/dev/mdx-preview.nvim
pnpm add --global .
```

After that, no `package.json` is needed next to the MDX file:

```sh
cd /tmp/plans
mdx-preview serve ./foo/foo.mdx --open
```

List preview servers that `mdx-preview` started, or close all of them:

```sh
mdx-preview servers
mdx-preview stop --all
```

A site directory needs one of `index.mdx`, `index.md`, `README.mdx`, or `README.md`.

`build` is the canonical shareable export. It produces a static `index.html` and assets that work on any static host. `--single-file` inlines JavaScript and CSS into one HTML file when a recipient explicitly needs a portable file.

When previewing in the browser, the **Export HTML** button downloads that same self-contained HTML artifact directly. It builds locally and does not upload the document anywhere.

## Local plans and sites

Create an artifact that can live in source control:

```sh
pnpm mdx-preview new checkout-flow --out plans --title "Checkout flow"
pnpm mdx-preview serve plans/checkout-flow --open
pnpm mdx-preview build plans/checkout-flow --out dist/checkout-flow
```

The default `plans/<slug>/` convention is intentional. It gives agents and people one durable MDX artifact to review, edit, build, and publish.

## Components

Built-ins make relationships easier to read without falling back to a pile of ad hoc HTML:

```mdx
<Callout title="Decision">Static directories are the reliable export format.</Callout>

<Flow steps={[{ title: "Write", detail: "Create the MDX artifact." }, { title: "Preview" }, { title: "Share" }]} />
```

Use `pnpm mdx-preview components list` for the complete registry. It includes `Button`, `Callout`, `Flow`, `Comparison`, `FileMap`, `Decision`, `Timeline`, `Metric`, `Architecture`, `Diagram`, and `CodeBlock`, plus when each component is useful.

`Diagram` is the default directed-diagram tool. Agents provide concise nodes and edges; Dagre supplies deterministic spacing and arrow routing so diagrams remain readable without manual coordinate work. Set `renderer="flow"` for an opt-in read-only React Flow canvas with pan, zoom, and fit-view controls. See the [component registry](components/REGISTRY.md#diagram) and the [example plan](examples/plans/toolkit-workflow/index.mdx).

MDX only allows top-level ESM imports and exports. Export local components instead of declaring a bare top-level `function` or `const`.

## Custom component registry

Add `mdx-preview.config.mjs` beside a site or in an ancestor directory:

```js
export default {
  components: [
    {
      name: "StatusBadge",
      module: "./components/status-badge.jsx",
      export: "StatusBadge",
      description: "Show the current state of a plan or release.",
      when: "Use for a compact status label near a title.",
    },
  ],
};
```

Registered components are available to every MDX file below that config. Keep a component's `description`, `when`, props, and example in your project’s agent instructions so agents know how to use it, not just how to import it. See [the example](examples/custom-registry).

## Tailwind, Base UI, and themes

Tailwind v4 scans the active document directory and the bundled component kit. The built-ins are Tailwind-first and use CSS variables as their theme contract; Base UI powers interactive primitives such as `Button` without imposing an opaque component library.

The viewer defaults to the browser preference. Its **System**, **Light**, and **Dark** controls set a local preference without changing the MDX file.

For a site-wide theme, add `theme` to the nearest `mdx-preview.config.mjs`. It applies to every MDX file below that config:

```js
export default {
  theme: "./theme.css",
  components: [],
};
```

Use a document-local CSS import when one plan needs an exception; it loads after the site theme and can override its tokens. Define both palettes in either stylesheet:

```css
:root {
  --background: oklch(0.98 0.01 100);
  --foreground: oklch(0.2 0.02 255);
  --primary: oklch(0.48 0.14 230);
  --border: oklch(0.8 0.02 255);
}

:root[data-theme="dark"] {
  --background: oklch(0.16 0.02 255);
  --foreground: oklch(0.95 0.01 100);
  --primary: oklch(0.72 0.14 230);
  --border: oklch(0.34 0.03 255);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --background: oklch(0.16 0.02 255);
    --foreground: oklch(0.95 0.01 100);
    --primary: oklch(0.72 0.14 230);
    --border: oklch(0.34 0.03 255);
  }
}
```

Use Tailwind utilities in MDX or nearby custom components:

```mdx
<section className="rounded-xl bg-slate-900 p-8 text-white shadow-xl">
  <h1 className="text-3xl font-bold">Hello</h1>
</section>
```

The default theme is bundled with the preview. Import a neighboring CSS file from MDX when the document needs custom styles:

```mdx
import "./article.css";
```

Project-specific Tailwind themes and plugins are intentionally not loaded automatically. Add custom components through the registry when a project needs its own abstractions.

## Agent skill

The repo ships an installable `mdx-sites` skill. A skill is agent-facing instruction and reference material: it tells an agent when to create a durable MDX artifact, which built-ins fit the task, how to preview/build it, and that publishing requires approval. It does not change Neovim behavior or automatically add project-specific components.

Install it into the target project's agent-skill directory:

```sh
mdx-preview skill install --target /path/to/project/.agents/skills
```

Once installed, invoke it explicitly as `$mdx-sites` or let a compatible agent select it when the task calls for a visual plan, local MDX site, preview, export, or publication. For custom components, add them to `mdx-preview.config.mjs` and document their intent, props, and examples in that project's agent instructions so the agent has the context to use them well.

## Here Now

Build first, then publish when the artifact is ready:

```sh
pnpm mdx-preview publish plans/checkout-flow --out dist/checkout-flow
```

The command reads `HERENOW_API_KEY` for a permanent deployment. Without it, Here Now creates a 24-hour anonymous site and prints the one-time claim URL. Keep `.herenow/` out of source control. Here Now can then apply password or restricted access policies to a claimed site.

## Development

```sh
pnpm install --frozen-lockfile
pnpm format
pnpm lint
pnpm check
luac -p lua/mdx-preview/init.lua
```

`oxfmt` formats JavaScript, JSX, CSS, JSON, Markdown, and MDX. Lua is checked with `luac`.
