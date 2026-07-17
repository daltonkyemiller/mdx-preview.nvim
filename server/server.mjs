import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { basename, dirname, resolve } from "node:path";
import { createServer } from "vite";
import { createMdxPreviewAliases, createMdxPreviewPlugins } from "./runtime.mjs";
import { loadRegistry, pluginRoot } from "./registry.mjs";

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
          await loadRegistry(previewFile);
          response.setHeader("Content-Type", "application/json");
          response.end(
            JSON.stringify({
              directory: dirname(previewFile),
              file: previewFile,
              name: basename(previewFile),
              version: fileStats.mtimeMs,
            })
          );
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
