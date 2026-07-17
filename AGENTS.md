# AGENTS.md

## Repo shape

- `plugin/mdx-preview.lua` registers Neovim commands.
- `lua/mdx-preview/init.lua` owns Neovim state and the Node process.
- `bin/mdx-preview.mjs` is the standalone CLI.
- `server/runtime.mjs` is shared Vite, MDX, Tailwind, and registry behavior.
- `server/build.mjs` produces static directories or a single HTML file.
- `server/publish.mjs` publishes a finished static directory to Here Now.
- `components/` contains built-in React components and the agent-readable registry.
- `skills/mdx-sites/` is the installable local-plan skill.
- `web/` is the preview shell and default visual system.

Keep Neovim callbacks thin. Browser, MDX, registry, build, and publish behavior belongs outside Lua.

## Development

Use pnpm 11. Enable Corepack if `pnpm` is unavailable: `corepack enable`.

```sh
pnpm format
pnpm format:check
pnpm lint
pnpm lint:fix
pnpm check
pnpm test
pnpm test:neovim
luac -p lua/mdx-preview/init.lua
```

`oxfmt.json` is the formatter source of truth. Scripts pass it explicitly because current Oxfmt only auto-discovers `.oxfmtrc.json`.

## Runtime rules

- Keep the preview server local only by default.
- MDX files and custom components can live outside this repository. Do not assume imports resolve from the plugin directory.
- Built-in components must be registered in `components/index.jsx` and documented in `components/REGISTRY.md`.
- A custom `mdx-preview.config.mjs` descriptor needs `name`, `module`, `export`, `description`, and `when`. Keep descriptors agent-readable.
- Tailwind scans the active document directory. Preserve that document-scoped source behavior.
- Static directories are the primary export. Single-file output is an optional portability mode.
- Do not publish material or alter Here Now access settings without explicit user approval.

## Skill rules

- Keep `skills/mdx-sites/SKILL.md` concise and procedural.
- Validate the skill with `python /home/dalton/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/mdx-sites` after edits.
- Keep component guidance in `components/REGISTRY.md` in sync with runtime components.

## Changes

- Use conventional commits. Do not add co-author lines.
- Keep Node imports on the `node:` protocol.
- Verify generated sites with a real browser after changing runtime, components, or export behavior.
