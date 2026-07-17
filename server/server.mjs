import { compile } from "@mdx-js/mdx";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { readFile, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { basename, dirname, resolve } from "node:path";
import { createServer } from "vite";

const require = createRequire(import.meta.url);
const mdxReactRuntime = require.resolve("@mdx-js/react");

const argumentValue = (name) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
};

const statePath = argumentValue("--state");
const port = Number(argumentValue("--port") ?? 4321);

if (!statePath) {
  throw new Error("Missing --state path");
}

const getPreviewFile = async () => {
  const state = JSON.parse(await readFile(statePath, "utf8"));
  if (typeof state.file !== "string") {
    throw new Error("Preview state does not contain a file path");
  }

  return resolve(state.file);
};

const mdxPlugin = {
  name: "mdx-preview",
  async transform(source, id) {
    if (!id.includes("?mdx-preview")) {
      return undefined;
    }

    const compiled = await compile(source, {
      jsxImportSource: "react",
      outputFormat: "program",
      providerImportSource: "@mdx-js/react",
    });
    return String(compiled);
  },
};

const tailwindSourcePlugin = {
  name: "mdx-preview-tailwind-source",
  enforce: "pre",
  transform(source, id) {
    if (!id.includes("/tailwind.css?")) {
      return undefined;
    }

    const query = id.split("?", 2)[1];
    const sourceDirectory = new URLSearchParams(query).get("source");
    if (!sourceDirectory) {
      return source;
    }

    return `${source}\n@source "${sourceDirectory}";`;
  },
};

const documentApiPlugin = {
  name: "mdx-preview-api",
  configureServer(developmentServer) {
    developmentServer.middlewares.use("/api/document", async (_request, response) => {
      try {
        const file = await getPreviewFile();
        const fileStats = await stat(file);
        response.setHeader("Content-Type", "application/json");
        response.end(
          JSON.stringify({
            directory: dirname(file),
            file,
            name: basename(file),
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
  configFile: false,
  plugins: [tailwindSourcePlugin, tailwindcss(), react(), mdxPlugin, documentApiPlugin],
  root: resolve(dirname(fileURLToPath(import.meta.url)), "..", "web"),
  resolve: {
    alias: {
      "@mdx-js/react": mdxReactRuntime,
    },
  },
  server: {
    fs: {
      strict: false,
    },
    port,
  },
  appType: "spa",
});

await server.listen();
server.printUrls();
