import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { loadSiteConfiguration, pluginRoot } from "./registry.mjs";

const componentRegistryPath = resolve(pluginRoot, "components/REGISTRY.md");

const resolveContextDocument = async (input = ".") => {
  const path = resolve(input);
  return (await stat(path)).isDirectory() ? resolve(path, ".mdx-preview-context.mdx") : path;
};

const formatProjectComponents = (components) => {
  if (components.length === 0) {
    return "## Project-specific components\n\nNo project-specific components are registered for this path.";
  }

  const entries = components.map(
    (component) => `### \`${component.name}\`

- Module: \`${component.module}\`
- Export: \`${component.export}\`
- Description: ${component.description}
- Use when: ${component.when}`
  );
  return `## Project-specific components\n\n${entries.join("\n\n")}`;
};

export const getComponentContext = async (input) => {
  const documentPath = await resolveContextDocument(input);
  const [builtInComponents, site] = await Promise.all([
    readFile(componentRegistryPath, "utf8"),
    loadSiteConfiguration(documentPath),
  ]);

  return `${builtInComponents.trim()}\n\n${formatProjectComponents(site.components)}\n`;
};
