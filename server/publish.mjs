import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

const contentType = (filePath) => {
  const extension = filePath.split(".").pop();
  const types = {
    css: "text/css; charset=utf-8",
    html: "text/html; charset=utf-8",
    ico: "image/x-icon",
    jpg: "image/jpeg",
    js: "text/javascript; charset=utf-8",
    json: "application/json; charset=utf-8",
    png: "image/png",
    svg: "image/svg+xml",
    webp: "image/webp",
  };

  return types[extension] ?? "application/octet-stream";
};

const filesIn = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve(directory, entry.name);
      return entry.isDirectory() ? filesIn(entryPath) : [entryPath];
    })
  );

  return files.flat();
};

const readState = async (directory) => {
  try {
    return JSON.parse(await readFile(resolve(directory, ".herenow/state.json"), "utf8"));
  } catch {
    return { publishes: {} };
  }
};

export const publishSite = async ({ directory, slug }) => {
  const files = await filesIn(directory);
  const artifacts = await Promise.all(
    files.map(async (filePath) => {
      const contents = await readFile(filePath);
      return {
        contentType: contentType(filePath),
        contents,
        hash: createHash("sha256").update(contents).digest("hex"),
        path: relative(directory, filePath),
        size: (await stat(filePath)).size,
      };
    })
  );
  const state = await readState(directory);
  const previous = slug ? state.publishes[slug] : undefined;
  const headers = { "Content-Type": "application/json", "X-HereNow-Client": "mdx-preview/cli" };
  const apiKey = process.env.HERENOW_API_KEY;
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const body = {
    files: artifacts.map(({ contentType: type, hash, path, size }) => ({ contentType: type, hash, path, size })),
    ...(previous?.claimToken ? { claimToken: previous.claimToken } : {}),
  };
  const endpoint = slug ? `https://here.now/api/v1/publish/${slug}` : "https://here.now/api/v1/publish";
  const publishResponse = await fetch(endpoint, { body: JSON.stringify(body), headers, method: slug ? "PUT" : "POST" });
  if (!publishResponse.ok) {
    throw new Error(`Here Now publish failed: ${await publishResponse.text()}`);
  }

  const publish = await publishResponse.json();
  for (const upload of publish.upload.uploads) {
    const artifact = artifacts.find((candidate) => candidate.path === upload.path);
    await fetch(upload.url, { body: artifact.contents, headers: upload.headers, method: upload.method });
  }

  const finalizeResponse = await fetch(publish.upload.finalizeUrl, {
    body: JSON.stringify({ versionId: publish.upload.versionId }),
    headers,
    method: "POST",
  });
  if (!finalizeResponse.ok) {
    throw new Error(`Here Now finalize failed: ${await finalizeResponse.text()}`);
  }

  const finalization = await finalizeResponse.json();
  const nextState = {
    publishes: {
      ...state.publishes,
      [publish.slug]: {
        claimToken: publish.claimToken,
        siteUrl: finalization.siteUrl,
      },
    },
  };
  const stateDirectory = resolve(directory, ".herenow");
  await mkdir(stateDirectory, { recursive: true });
  await writeFile(resolve(stateDirectory, "state.json"), JSON.stringify(nextState, null, 2));
  return { claimUrl: publish.claimUrl, siteUrl: finalization.siteUrl };
};
