#!/usr/bin/env node

import { mkdir, stat, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { buildSite } from "../server/build.mjs";
import { publishSite } from "../server/publish.mjs";
import { startPreviewServer } from "../server/server.mjs";
import { pluginRoot } from "../server/registry.mjs";
import { listPreviewServers, stopPreviewServers } from "../server/servers.mjs";

const usage = `mdx-preview <command> [path]

Commands:
  new <slug> [--out plans] [--title name]
  serve <file-or-directory> [--port 4321] [--open]
  build <file-or-directory> [--out dist] [--single-file]
  publish <file-or-directory> [--out dist] [--slug name]
  servers
  stop --all
  skill install [--target .agents/skills]
  components list`;

const argumentValue = (argumentsList, name) => {
  const index = argumentsList.indexOf(name);
  return index === -1 ? undefined : argumentsList[index + 1];
};

const resolveDocument = async (input) => {
  const path = resolve(input);
  if ((await stat(path)).isFile()) {
    return path;
  }

  for (const name of ["index.mdx", "index.md", "README.mdx", "README.md"]) {
    try {
      const candidate = resolve(path, name);
      if ((await stat(candidate)).isFile()) {
        return candidate;
      }
    } catch {}
  }

  throw new Error(`No index.mdx, index.md, README.mdx, or README.md found in ${path}`);
};

const openBrowser = async (url) => {
  const command = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  const { spawn } = await import("node:child_process");
  spawn(command, [url], { detached: true, stdio: "ignore" }).unref();
};

const installSkill = async (target) => {
  const source = resolve(pluginRoot, "skills/mdx-sites");
  const destination = resolve(target, "mdx-sites");
  const { cp } = await import("node:fs/promises");
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination, { force: true, recursive: true });
  console.log(`Installed mdx-sites skill at ${destination}`);
};

const createSite = async ({ output, slug, title }) => {
  const directory = resolve(output, slug);
  await mkdir(directory, { recursive: true });
  await writeFile(
    resolve(directory, "index.mdx"),
    `# ${title}\n\n<Callout title="Start here">Replace this with the plan or site you want to share.</Callout>\n\n<Flow steps={[{ title: "Write", detail: "Author the MDX." }, { title: "Preview", detail: "Run mdx-preview serve." }, { title: "Share", detail: "Build or publish the site." }]} />\n`
  );
  console.log(`Created ${directory}`);
};

const command = process.argv[2];
const argumentsList = process.argv.slice(3);

if (!command || command === "--help" || command === "-h") {
  console.log(usage);
  process.exit(0);
}

if (command === "components" && argumentsList[0] === "list") {
  console.log(await (await import("node:fs/promises")).readFile(resolve(pluginRoot, "components/REGISTRY.md"), "utf8"));
  process.exit(0);
}

if (command === "skill" && argumentsList[0] === "install") {
  await installSkill(argumentValue(argumentsList, "--target") ?? ".agents/skills");
  process.exit(0);
}

if (command === "new") {
  const slug = argumentsList[0];
  if (!slug || slug.startsWith("-")) {
    throw new Error("Provide a slug for the new site");
  }

  await createSite({
    output: argumentValue(argumentsList, "--out") ?? "plans",
    slug,
    title: argumentValue(argumentsList, "--title") ?? slug.replaceAll("-", " "),
  });
  process.exit(0);
}

if (command === "servers") {
  const servers = await listPreviewServers();
  if (servers.length === 0) {
    console.log("No mdx-preview servers running.");
  } else {
    console.log("PORT  FILE");
    servers.forEach((server) => console.log(`${server.port}  ${server.file}`));
  }
  process.exit(0);
}

if (command === "stop" && argumentsList.includes("--all")) {
  const servers = await stopPreviewServers();
  console.log(`Stopped ${servers.length} mdx-preview server${servers.length === 1 ? "" : "s"}.`);
  process.exit(0);
}

const documentPath = await resolveDocument(argumentsList[0] ?? ".");
const outDir = resolve(argumentValue(argumentsList, "--out") ?? "dist");

if (command === "serve") {
  const port = Number(argumentValue(argumentsList, "--port") ?? 4321);
  const server = await startPreviewServer({ file: documentPath, port });
  const url = `http://localhost:${server.mdxPreviewPort}`;
  server.printUrls();
  if (argumentsList.includes("--open")) {
    await openBrowser(url);
  }
} else if (command === "build") {
  await buildSite({ documentPath, outDir, singleFile: argumentsList.includes("--single-file") });
  console.log(`Built ${basename(documentPath)} to ${outDir}`);
} else if (command === "publish") {
  await buildSite({ documentPath, outDir, singleFile: false });
  const result = await publishSite({ directory: outDir, slug: argumentValue(argumentsList, "--slug") });
  console.log(result.siteUrl);
  if (result.claimUrl) {
    console.log(`Claim this anonymous site: ${result.claimUrl}`);
  }
} else {
  console.error(usage);
  process.exit(1);
}
