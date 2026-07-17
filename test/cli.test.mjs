import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { buildSite } from "../server/build.mjs";
import { startPreviewServer } from "../server/server.mjs";

const execute = promisify(execFile);
const fixture = (name) => resolve("test/fixtures", name);
const temporaryDirectory = async (prefix) => mkdtemp(resolve(tmpdir(), prefix));

test("builds a static site with custom registry components", async (context) => {
  const output = await temporaryDirectory("mdx-preview-static-");
  context.after(() => rm(output, { force: true, recursive: true }));

  await buildSite({ documentPath: resolve("examples/custom-registry/index.mdx"), outDir: output });

  assert.match(await readFile(resolve(output, "index.html"), "utf8"), /MDX Preview/);
  assert.ok((await readdir(resolve(output, "assets"))).length > 0);
});

test("exports one HTML file when requested", async (context) => {
  const output = await temporaryDirectory("mdx-preview-single-");
  context.after(() => rm(output, { force: true, recursive: true }));

  await buildSite({ documentPath: resolve("examples/custom-registry/index.mdx"), outDir: output, singleFile: true });

  assert.deepEqual(await readdir(output), ["index.html"]);
  assert.match(await readFile(resolve(output, "index.html"), "utf8"), /Loaded from mdx-preview.config.mjs/);
});

test("exports standalone HTML from the preview server", async (context) => {
  const server = await startPreviewServer({ file: resolve("examples/custom-registry/index.mdx"), port: 0 });
  const address = server.httpServer.address();
  const port = typeof address === "object" && address ? address.port : null;

  context.after(() => server.close());
  assert.ok(port);

  const response = await fetch(`http://localhost:${port}/api/export`, { method: "POST" });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-disposition") ?? "", /attachment; filename="index.html"/);
  assert.match(await response.text(), /Loaded from mdx-preview.config.mjs/);
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
