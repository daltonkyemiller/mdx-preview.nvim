import { stat } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { loadSiteConfiguration } from "./registry.mjs";

const documentNames = ["index.mdx", "index.md", "README.mdx", "README.md"];

export const resolveDocument = async (input) => {
  const path = resolve(input);
  if ((await stat(path)).isFile()) {
    return path;
  }

  for (const name of documentNames) {
    try {
      const candidate = resolve(path, name);
      if ((await stat(candidate)).isFile()) {
        return candidate;
      }
    } catch {}
  }

  throw new Error(`No ${documentNames.join(", ")} found in ${path}`);
};

export const describeDocument = async (documentPath) => {
  const file = resolve(documentPath);
  const [fileStats, site] = await Promise.all([stat(file), loadSiteConfiguration(file)]);

  return {
    directory: dirname(file),
    file,
    name: basename(file),
    theme: site.theme,
    themeVersion: site.themeVersion,
    version: fileStats.mtimeMs,
  };
};
