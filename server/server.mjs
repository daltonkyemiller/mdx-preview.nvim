import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { basename, dirname, resolve } from "node:path";
import { createServer } from "vite";
import { buildSite } from "./build.mjs";
import { createMdxPreviewAliases, createMdxPreviewPlugins } from "./runtime.mjs";
import { loadSiteConfiguration, pluginRoot } from "./registry.mjs";

const argumentValue = (name) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
};

const getStateFile = async (statePath) => {
  const state = JSON.parse(await readFile(statePath, "utf8"));
  if (typeof state.file !== "string") {
    throw new Error("Preview state does not contain a file path");
  }

  return resolve(state.file);
};

const exportName = (file) => `${basename(file).replace(/\.(md|mdx)$/i, "") || "mdx-preview"}.html`;

const createSingleFileExport = async (file) => {
  const outputDirectory = await mkdtemp(resolve(tmpdir(), "mdx-preview-export-"));

  try {
    await buildSite({ documentPath: file, outDir: outputDirectory, singleFile: true });
    return await readFile(resolve(outputDirectory, "index.html"));
  } finally {
    await rm(outputDirectory, { force: true, recursive: true });
  }
};

export const startPreviewServer = async ({ file, port = 4321, statePath } = {}) => {
  if (!file && !statePath) {
    throw new Error("Provide a file or state path");
  }

  const getPreviewFile = async () => (file ? resolve(file) : getStateFile(statePath));
  const documentApiPlugin = {
    name: "mdx-preview-api",
    configureServer(developmentServer) {
      developmentServer.middlewares.use("/api/document", async (_request, response) => {
        try {
          const previewFile = await getPreviewFile();
          const fileStats = await stat(previewFile);
          const site = await loadSiteConfiguration(previewFile);
          response.setHeader("Content-Type", "application/json");
          response.end(
            JSON.stringify({
              directory: dirname(previewFile),
              file: previewFile,
              name: basename(previewFile),
              theme: site.theme,
              themeVersion: site.themeVersion,
              version: fileStats.mtimeMs,
            })
          );
        } catch (error) {
          response.statusCode = 500;
          response.setHeader("Content-Type", "application/json");
          response.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
        }
      });
      developmentServer.middlewares.use("/api/export", async (request, response) => {
        if (request.method !== "POST") {
          response.statusCode = 405;
          response.setHeader("Allow", "POST");
          response.end();
          return;
        }

        try {
          const previewFile = await getPreviewFile();
          const html = await createSingleFileExport(previewFile);
          response.setHeader("Content-Disposition", `attachment; filename="${exportName(previewFile)}"`);
          response.setHeader("Content-Type", "text/html; charset=utf-8");
          response.end(html);
        } catch (error) {
          response.statusCode = 500;
          response.setHeader("Content-Type", "application/json");
          response.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
        }
      });
    },
  };

  const server = await createServer({
    appType: "spa",
    configFile: false,
    plugins: [...createMdxPreviewPlugins(), documentApiPlugin],
    resolve: { alias: createMdxPreviewAliases() },
    root: resolve(pluginRoot, "web"),
    server: { fs: { strict: false }, port },
  });

  await server.listen();
  return server;
};

const statePath = argumentValue("--state");
const file = argumentValue("--file");
const port = Number(argumentValue("--port") ?? 4321);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = await startPreviewServer({ file, port, statePath });
  server.printUrls();
}
