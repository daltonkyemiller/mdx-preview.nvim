# Context

## Document

A Markdown or MDX file selected for preview, build, export, or publish. A Document may inherit a Site Configuration from an ancestor directory.

## Site Configuration

The optional `mdx-preview.config.mjs` nearest to a Document. It declares custom MDX components and an optional site-wide theme stylesheet.

## Preview Session

A local browser preview for one active Document. A Preview Session owns the resolved port, browser-facing actions, and its local registry record. In Neovim follow-buffer mode, the active Document may change while the Preview Session remains running.

## Static Artifact

The built directory or single HTML file produced from a Document for sharing or publishing.
