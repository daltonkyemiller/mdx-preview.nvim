import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { basename, dirname, resolve } from "node:path";
import { createServer } from "vite";
import { buildSite } from "./build.mjs";
import { createMdxPreviewAliases, createMdxPreviewPlugins } from "./runtime.mjs";
import { loadSiteConfiguration, pluginRoot } from "./registry.mjs";
import { registerPreviewServer } from "./servers.mjs";

const argumentValue = (name) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
};

const shutdownDelayMs = 50;

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

export const startPreviewServer = async ({ file, port = 4321, registryDirectory, statePath } = {}) => {
  if (!file && !statePath) {
    throw new Error("Provide a file or state path");
  }

  const getPreviewFile = async () => (file ? resolve(file) : getStateFile(statePath));
  const serverId = randomUUID();
  const serverToken = randomUUID();
  let closeServer;
  const apiMiddleware = async (request, response, next) => {
    const path = request.url?.split("?", 1)[0];
    if (path === "/api/status") {
      if (request.headers["x-mdx-preview-token"] !== serverToken) {
        response.statusCode = 403;
        response.end();
        return;
      }

      response.statusCode = 204;
      response.end();
      return;
    }

    if (path === "/api/stop") {
      if (request.method !== "POST") {
        response.statusCode = 405;
        response.setHeader("Allow", "POST");
        response.end();
        return;
      }

      if (request.headers["x-mdx-preview-token"] !== serverToken) {
        response.statusCode = 403;
        response.end();
        return;
      }

      response.statusCode = 204;
      response.end();
      setTimeout(() => void closeServer(), shutdownDelayMs);
      return;
    }

    if (path === "/api/document") {
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
      return;
    }

    if (path === "/api/export") {
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
      return;
    }

    next();
  };

  const server = await createServer({
    appType: "spa",
    configFile: false,
    plugins: createMdxPreviewPlugins(),
    resolve: { alias: createMdxPreviewAliases() },
    root: resolve(pluginRoot, "web"),
    server: { fs: { strict: false }, port },
  });

  const fallbackIndex = server.middlewares.stack.findIndex(
    (middleware) => middleware.handle.name === "viteHtmlFallbackMiddleware"
  );
  server.middlewares.stack.splice(fallbackIndex, 0, { handle: apiMiddleware, route: "" });

  await server.listen();
  const address = server.httpServer.address();
  const activePort = typeof address === "object" && address ? address.port : undefined;
  if (!activePort) {
    await server.close();
    throw new Error("Preview server did not expose a port");
  }

  const unregister = await registerPreviewServer({
    directory: registryDirectory,
    file: await getPreviewFile(),
    id: serverId,
    port: activePort,
    token: serverToken,
  });
  closeServer = async () => {
    await server.close();
    await unregister();
  };
  server.httpServer.once("close", () => void unregister());
  server.mdxPreviewPort = activePort;
  return server;
};

const statePath = argumentValue("--state");
const file = argumentValue("--file");
const port = Number(argumentValue("--port") ?? 4321);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = await startPreviewServer({ file, port, statePath });
  server.printUrls();
}
