# mdx-preview.nvim

Preview Markdown and MDX from Neovim in a browser. It runs a local Vite server, renders MDX with React, and follows the active `.md` or `.mdx` buffer when configured to do so.

React imports work relative to the MDX file. Tailwind v4 utilities work out of the box.

## Requirements

- Neovim 0.10 or newer
- Node.js 20 or newer
- pnpm 11

## Install

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

For another plugin manager, install the plugin and run `pnpm install --frozen-lockfile` in its checkout. Then call `require("mdx-preview").setup()` during Neovim startup.

## Configuration

These are the defaults:

```lua
require("mdx-preview").setup({
  port = 4321,
  open_browser = true,
  follow_buffer = true,
})
```

`open_browser` controls whether `:MdxPreview` opens the local URL. `follow_buffer` updates the existing preview when you enter another Markdown or MDX buffer.

## Commands

- `:MdxPreview` starts the local preview server and renders the current `.md` or `.mdx` file.
- `:MdxPreviewStop` stops the server.

Starting preview again while the server is already running changes the rendered file. Saving the active document refreshes the browser preview.

## MDX and React

MDX supports top-level ESM imports and exports. Export local components, or import them from a neighboring file:

```mdx
import { Callout } from "./components/callout.jsx";

export function Status({ children }) {
  return <strong>{children}</strong>;
}

# Hello

<Callout>
  <Status>Rendered by React.</Status>
</Callout>
```

MDX does not allow a bare top-level `function` or `const` declaration. Export it instead.

## Tailwind

Tailwind CSS v4 is included with the preview server. Utility classes in the active MDX file and its directory are scanned automatically:

```mdx
<section className="rounded-xl bg-slate-900 p-8 text-white shadow-xl">
  <h1 className="text-3xl font-bold">Hello</h1>
</section>
```

The preview uses Tailwind's default v4 theme. It does not load a project's Tailwind configuration, plugins, or custom theme yet.

## CSS

Import a stylesheet from the MDX file when the document needs custom styles:

```mdx
import "./article.css";

<article className="article">...</article>
```

Vite resolves that stylesheet relative to the MDX file.

## Development

```sh
pnpm install --frozen-lockfile
pnpm format
pnpm lint
pnpm check
luac -p lua/mdx-preview/init.lua
```

`oxfmt` formats JavaScript, JSX, CSS, and JSON. Lua is checked with `luac`.
