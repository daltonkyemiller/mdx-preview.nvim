import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { buildSite } from "./build.mjs";
import { resolveDocument } from "./document.mjs";
import { publishSite } from "./publish.mjs";
import { startPreviewSession } from "./preview-session.mjs";
import { pluginRoot } from "./registry.mjs";
import { listPreviewServers, stopPreviewServers } from "./servers.mjs";

export const usage = `mdx-preview <command> [path]

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

const openBrowser = async (url) => {
  const command = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  const { spawn } = await import("node:child_process");
  spawn(command, [url], { detached: true, stdio: "ignore" }).unref();
};

const installSkill = async (target) => {
  const source = resolve(pluginRoot, "skills/mdx-sites");
  const destination = resolve(target, "mdx-sites");
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination, { force: true, recursive: true });
  return `Installed mdx-sites skill at ${destination}`;
};

const createSite = async ({ output, slug, title }) => {
  const directory = resolve(output, slug);
  await mkdir(directory, { recursive: true });
  await writeFile(
    resolve(directory, "index.mdx"),
    `# ${title}\n\n<Callout title="Start here">Replace this with the plan or site you want to share.</Callout>\n\n<Flow steps={[{ title: "Write", detail: "Author the MDX." }, { title: "Preview", detail: "Run mdx-preview serve." }, { title: "Share", detail: "Build or publish the site." }]} />\n`
  );
  return `Created ${directory}`;
};

const defaultDependencies = {
  buildSite,
  createSite,
  installSkill,
  listPreviewServers,
  openBrowser,
  publishSite,
  readFile,
  resolveDocument,
  startPreviewSession,
  stopPreviewServers,
};

export const runCli = async ({ argumentsList, dependencies = {}, write = console.log }) => {
  const commands = { ...defaultDependencies, ...dependencies };
  const command = argumentsList[0];
  const commandArguments = argumentsList.slice(1);
  if (!command || command === "--help" || command === "-h") {
    write(usage);
    return;
  }

  if (command === "components" && commandArguments[0] === "list") {
    write(await commands.readFile(resolve(pluginRoot, "components/REGISTRY.md"), "utf8"));
    return;
  }

  if (command === "skill" && commandArguments[0] === "install") {
    write(await commands.installSkill(argumentValue(commandArguments, "--target") ?? ".agents/skills"));
    return;
  }

  if (command === "new") {
    const slug = commandArguments[0];
    if (!slug || slug.startsWith("-")) {
      throw new Error("Provide a slug for the new site");
    }

    write(
      await commands.createSite({
        output: argumentValue(commandArguments, "--out") ?? "plans",
        slug,
        title: argumentValue(commandArguments, "--title") ?? slug.replaceAll("-", " "),
      })
    );
    return;
  }

  if (command === "servers") {
    const servers = await commands.listPreviewServers();
    write(
      servers.length === 0
        ? "No mdx-preview servers running."
        : `PORT  FILE\n${servers.map((server) => `${server.port}  ${server.file}`).join("\n")}`
    );
    return;
  }

  if (command === "stop") {
    if (!commandArguments.includes("--all")) {
      throw new Error("Use mdx-preview stop --all");
    }

    const servers = await commands.stopPreviewServers();
    write(`Stopped ${servers.length} mdx-preview server${servers.length === 1 ? "" : "s"}.`);
    return;
  }

  if (!["serve", "build", "publish"].includes(command)) {
    throw new Error(usage);
  }

  const documentPath = await commands.resolveDocument(commandArguments[0] ?? ".");
  const outDir = resolve(argumentValue(commandArguments, "--out") ?? "dist");
  if (command === "serve") {
    const session = await commands.startPreviewSession({
      file: documentPath,
      port: Number(argumentValue(commandArguments, "--port") ?? 4321),
    });
    write(`Preview: ${session.url}`);
    if (commandArguments.includes("--open")) {
      await commands.openBrowser(session.url);
    }
    return;
  }

  if (command === "build") {
    await commands.buildSite({ documentPath, outDir, singleFile: commandArguments.includes("--single-file") });
    write(`Built ${basename(documentPath)} to ${outDir}`);
    return;
  }

  await commands.buildSite({ documentPath, outDir, singleFile: false });
  const result = await commands.publishSite({ directory: outDir, slug: argumentValue(commandArguments, "--slug") });
  write(result.siteUrl);
  if (result.claimUrl) {
    write(`Claim this anonymous site: ${result.claimUrl}`);
  }
};
