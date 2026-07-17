# AGENTS.md

## Repo shape

- `plugin/mdx-preview.lua` registers the Neovim commands.
- `lua/mdx-preview/init.lua` owns Neovim state, configuration, and the Node process.
- `server/server.mjs` owns Vite, MDX compilation, Tailwind source registration, and the preview API.
- `web/` is the browser renderer.

Keep the Lua plugin thin. Browser and MDX behavior belongs in `server/` or `web/`, not in Neovim callbacks.

## Development

Use pnpm 11 for dependencies and package scripts. Enable Corepack if `pnpm` is unavailable: `corepack enable`.

```sh
pnpm format
pnpm format:check
pnpm lint
pnpm lint:fix
pnpm check
luac -p lua/mdx-preview/init.lua
```

`oxfmt.json` is the formatter source of truth. The format scripts pass it explicitly because the current Oxfmt CLI only auto-discovers `.oxfmtrc.json`.

## Preview behavior

- The server is local only. Do not expose it beyond localhost by default.
- MDX files can live outside this repository. Keep internal dependencies resolvable from the plugin checkout.
- Tailwind scans the directory containing the active MDX file. Preserve that document-scoped source behavior when changing the Vite or CSS pipeline.
- Do not add project-specific Tailwind config loading without an explicit configuration design.

## Changes

- Run the commands above after JavaScript, JSX, CSS, JSON, or Lua changes.
- Keep Node imports on the `node:` protocol.
- Use conventional commits. Do not add co-author lines.
