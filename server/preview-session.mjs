import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { createServer } from "vite";
import { buildSite } from "./build.mjs";
import { describeDocument } from "./document.mjs";
import { createMdxPreviewAliases, createMdxPreviewPlugins } from "./runtime.mjs";
import { pluginRoot } from "./registry.mjs";
import { registerPreviewServer } from "./servers.mjs";

const shutdownDelayMs = 50;

const readStateDocument = async (statePath) => {
  const state = JSON.parse(await readFile(statePath, "utf8"));
  if (typeof state.file !== "string") {
    throw new Error("Preview state does not contain a file path");
  }

  return resolve(state.file);
};

const exportName = (file) => `${file.replace(/^.*\//, "").replace(/\.(md|mdx)$/i, "") || "mdx-preview"}.html`;

const exportDocument = async (file) => {
  const outputDirectory = await mkdtemp(resolve(tmpdir(), "mdx-preview-export-"));

  try {
    await buildSite({ documentPath: file, outDir: outputDirectory, singleFile: true });
    return await readFile(resolve(outputDirectory, "index.html"));
  } finally {
    await rm(outputDirectory, { force: true, recursive: true });
  }
};

const isAuthorized = (request, token) => request.headers["x-mdx-preview-token"] === token;

const installPreviewActions = ({ close, getDocument, server, token }) => {
  const actionMiddleware = async (request, response, next) => {
    const path = request.url?.split("?", 1)[0];
    if (path === "/api/status") {
      response.statusCode = isAuthorized(request, token) ? 204 : 403;
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

      if (!isAuthorized(request, token)) {
        response.statusCode = 403;
        response.end();
        return;
      }

      response.statusCode = 204;
      response.end();
      setTimeout(() => void close(), shutdownDelayMs);
      return;
    }

    if (path === "/api/document") {
      try {
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify(await describeDocument(await getDocument())));
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
        const file = await getDocument();
        response.setHeader("Content-Disposition", `attachment; filename="${exportName(file)}"`);
        response.setHeader("Content-Type", "text/html; charset=utf-8");
        response.end(await exportDocument(file));
      } catch (error) {
        response.statusCode = 500;
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
      }
      return;
    }

    next();
  };

  const fallbackIndex = server.middlewares.stack.findIndex(
    (middleware) => middleware.handle.name === "viteHtmlFallbackMiddleware"
  );
  server.middlewares.stack.splice(fallbackIndex, 0, { handle: actionMiddleware, route: "" });
};

export const startPreviewSession = async ({ file, port = 4321, registryDirectory, statePath } = {}) => {
  if (!file && !statePath) {
    throw new Error("Provide a file or state path");
  }

  const getDocument = async () => (file ? resolve(file) : readStateDocument(statePath));
  const id = randomUUID();
  const token = randomUUID();
  let close;
  const server = await createServer({
    appType: "spa",
    configFile: false,
    plugins: createMdxPreviewPlugins(),
    resolve: { alias: createMdxPreviewAliases() },
    root: resolve(pluginRoot, "web"),
    server: { fs: { strict: false }, port },
  });

  installPreviewActions({ close: () => close(), getDocument, server, token });
  await server.listen();

  const address = server.httpServer.address();
  const activePort = typeof address === "object" && address ? address.port : undefined;
  if (!activePort) {
    await server.close();
    throw new Error("Preview server did not expose a port");
  }

  const unregister = await registerPreviewServer({
    directory: registryDirectory,
    file: await getDocument(),
    id,
    port: activePort,
    token,
  });
  close = async () => {
    await server.close();
    await unregister();
  };
  server.httpServer.once("close", () => void unregister());

  return {
    close,
    port: activePort,
    url: `http://localhost:${activePort}`,
  };
};
