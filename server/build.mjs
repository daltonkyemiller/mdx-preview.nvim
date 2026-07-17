import { build } from "vite";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { viteSingleFile } from "vite-plugin-singlefile";
import { describeDocument } from "./document.mjs";
import { componentRegistryUrl, createMdxPreviewAliases, createMdxPreviewPlugins } from "./runtime.mjs";
import { pluginRoot } from "./registry.mjs";

const writeBuildEntry = async (directory, documentPath) => {
  const stylesPath = resolve(pluginRoot, "web/src/styles.css");
  const tailwindPath = resolve(pluginRoot, "web/src/tailwind.css");
  const { theme } = await describeDocument(documentPath);
  const entry = `
import React from "react";
import { createRoot } from "react-dom/client";
import { MDXProvider } from "@mdx-js/react";
import ${JSON.stringify(stylesPath)};
import ${JSON.stringify(`${tailwindPath}?source=${encodeURIComponent(dirname(documentPath))}`)};
${theme ? `import ${JSON.stringify(theme)};` : ""}
import Document from ${JSON.stringify(`${documentPath}?mdx-preview`)};
import { components } from ${JSON.stringify(componentRegistryUrl(documentPath))};

createRoot(document.getElementById("root")).render(
  <main className="document-frame">
    <MDXProvider components={components}>
      <Document />
    </MDXProvider>
  </main>
);
`;

  await writeFile(
    resolve(directory, "index.html"),
    '<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>MDX Preview</title></head><body><div id="root"></div><script type="module" src="/entry.jsx"></script></body></html>'
  );
  await writeFile(resolve(directory, "entry.jsx"), entry);
};

export const buildSite = async ({ documentPath, outDir, singleFile = false }) => {
  const buildDirectory = await mkdtemp(resolve(tmpdir(), "mdx-preview-build-"));

  try {
    await writeBuildEntry(buildDirectory, documentPath);
    await build({
      appType: "spa",
      base: "./",
      configFile: false,
      plugins: [...createMdxPreviewPlugins(), ...(singleFile ? [viteSingleFile()] : [])],
      resolve: { alias: createMdxPreviewAliases() },
      root: buildDirectory,
      build: {
        emptyOutDir: true,
        outDir,
      },
    });
  } finally {
    await rm(buildDirectory, { force: true, recursive: true });
  }
};
