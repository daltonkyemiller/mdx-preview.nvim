import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { buildSite } from "../server/build.mjs";
import { runCli } from "../server/cli.mjs";
import { getComponentContext } from "../server/component-context.mjs";
import { describeDocument, resolveDocument } from "../server/document.mjs";
import { loadSiteConfiguration } from "../server/registry.mjs";
import { startPreviewSession } from "../server/preview-session.mjs";
import { listPreviewServers, stopPreviewServers } from "../server/servers.mjs";

const execute = promisify(execFile);
const fixture = (name) => resolve("test/fixtures", name);
const temporaryDirectory = async (prefix) => mkdtemp(resolve(tmpdir(), prefix));
const availablePort = () =>
  new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (typeof address !== "object" || !address) {
        reject(new Error("Could not reserve a test port"));
        return;
      }

      server.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });

test("builds a static site with custom registry components", async (context) => {
  const output = await temporaryDirectory("mdx-preview-static-");
  context.after(() => rm(output, { force: true, recursive: true }));

  await buildSite({ documentPath: resolve("examples/custom-registry/index.mdx"), outDir: output });

  assert.match(await readFile(resolve(output, "index.html"), "utf8"), /MDX Preview/);
  assert.ok((await readdir(resolve(output, "assets"))).length > 0);
});

test("loads a configured site theme for every document below its config", async () => {
  const documentPath = resolve("examples/custom-registry/index.mdx");
  const site = await loadSiteConfiguration(documentPath);

  assert.equal(site.theme, resolve("examples/custom-registry/theme.css"));
  assert.equal(typeof site.themeVersion, "number");
});

test("resolves a site directory and describes the document used by every renderer", async () => {
  const documentPath = await resolveDocument("examples/custom-registry");
  const document = await describeDocument(documentPath);

  assert.equal(document.file, resolve("examples/custom-registry/index.mdx"));
  assert.equal(document.theme, resolve("examples/custom-registry/theme.css"));
  assert.equal(document.directory, resolve("examples/custom-registry"));
});

test("lists built-in and project-specific component context", async () => {
  const context = await getComponentContext("examples/custom-registry");

  assert.match(context, /## `Diagram`/);
  assert.match(context, /## Project-specific components/);
  assert.match(context, /### `StatusBadge`/);
  assert.match(context, /Use when: Use for a compact status label near a plan title\./);
});

test("exports one HTML file when requested", async (context) => {
  const output = await temporaryDirectory("mdx-preview-single-");
  context.after(() => rm(output, { force: true, recursive: true }));

  await buildSite({ documentPath: resolve("examples/custom-registry/index.mdx"), outDir: output, singleFile: true });

  assert.deepEqual(await readdir(output), ["index.html"]);
  assert.match(await readFile(resolve(output, "index.html"), "utf8"), /Loaded from mdx-preview.config.mjs/);
  assert.match(await readFile(resolve(output, "index.html"), "utf8"), /Registry resolution/);
});

test("exports standalone HTML from the preview session", async (context) => {
  const session = await startPreviewSession({
    file: resolve("examples/custom-registry/index.mdx"),
    port: await availablePort(),
  });

  context.after(() => session.close());

  const response = await fetch(`${session.url}/api/export`, { method: "POST" });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-disposition") ?? "", /attachment; filename="index.html"/);
  assert.match(await response.text(), /Loaded from mdx-preview.config.mjs/);
});

test("lists and stops registered preview servers", async (context) => {
  const registryDirectory = await temporaryDirectory("mdx-preview-servers-");
  const session = await startPreviewSession({
    file: resolve("examples/custom-registry/index.mdx"),
    port: await availablePort(),
    registryDirectory,
  });

  context.after(async () => {
    await session.close();
    await rm(registryDirectory, { force: true, recursive: true });
  });

  const servers = await listPreviewServers({ directory: registryDirectory });
  assert.equal(servers.length, 1);
  assert.equal(servers[0].file, resolve("examples/custom-registry/index.mdx"));

  const stoppedServers = await stopPreviewServers({ directory: registryDirectory });
  assert.equal(stoppedServers.length, 1);
  assert.deepEqual(await listPreviewServers({ directory: registryDirectory }), []);
});

test("runs CLI commands through one command interface", async () => {
  const messages = [];
  const calls = [];
  await runCli({
    argumentsList: ["serve", "plan.mdx", "--port", "4328", "--open"],
    dependencies: {
      openBrowser: async (url) => calls.push(["open", url]),
      resolveDocument: async (path) => {
        calls.push(["resolve", path]);
        return "/tmp/plan.mdx";
      },
      startPreviewSession: async (options) => {
        calls.push(["start", options]);
        return { url: "http://localhost:4330" };
      },
    },
    write: (message) => messages.push(message),
  });

  assert.deepEqual(calls, [
    ["resolve", "plan.mdx"],
    ["start", { file: "/tmp/plan.mdx", port: 4328 }],
    ["open", "http://localhost:4330"],
  ]);
  assert.deepEqual(messages, ["Preview: http://localhost:4330"]);
});

test("asks the component command for context at the requested path", async () => {
  const messages = [];
  const paths = [];
  await runCli({
    argumentsList: ["components", "list", "plans/release"],
    dependencies: {
      getComponentContext: async (path) => {
        paths.push(path);
        return "Component context";
      },
    },
    write: (message) => messages.push(message),
  });

  assert.deepEqual(paths, ["plans/release"]);
  assert.deepEqual(messages, ["Component context"]);
});

test("rejects an invalid component registry", async (context) => {
  const output = await temporaryDirectory("mdx-preview-invalid-");
  context.after(() => rm(output, { force: true, recursive: true }));

  await assert.rejects(
    buildSite({ documentPath: resolve(fixture("invalid-registry/index.mdx")), outDir: output }),
    /Invalid component registry/
  );
});

test("creates a local site from the CLI", async (context) => {
  const output = await temporaryDirectory("mdx-preview-new-");
  context.after(() => rm(output, { force: true, recursive: true }));

  await execute(process.execPath, [
    "bin/mdx-preview.mjs",
    "new",
    "release-plan",
    "--out",
    output,
    "--title",
    "Release plan",
  ]);

  assert.match(await readFile(resolve(output, "release-plan/index.mdx"), "utf8"), /# Release plan/);
});
