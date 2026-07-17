import { stat } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

export const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const componentsModule = resolve(pluginRoot, "components/index.jsx");

const isComponentDescriptor = (component) =>
  typeof component === "object" &&
  component !== null &&
  typeof component.name === "string" &&
  typeof component.module === "string";

const findConfig = async (documentPath) => {
  let directory = dirname(documentPath);

  while (directory !== dirname(directory)) {
    const configPath = resolve(directory, "mdx-preview.config.mjs");
    try {
      await stat(configPath);
      return configPath;
    } catch {
      directory = dirname(directory);
    }
  }

  return undefined;
};

export const loadSiteConfiguration = async (documentPath) => {
  const configPath = await findConfig(documentPath);
  if (!configPath) {
    return { components: [], theme: undefined, themeVersion: undefined };
  }

  const configUrl = pathToFileURL(configPath);
  const configStats = await stat(configPath);
  configUrl.searchParams.set("t", String(configStats.mtimeMs));
  const config = (await import(configUrl.href)).default ?? {};
  const components = config.components ?? [];
  const theme = config.theme;

  if (!Array.isArray(components) || !components.every(isComponentDescriptor)) {
    throw new Error(`Invalid component registry in ${configPath}`);
  }

  if (theme !== undefined && typeof theme !== "string") {
    throw new Error(`Invalid theme path in ${configPath}`);
  }

  const themePath = theme ? resolve(dirname(configPath), theme) : undefined;
  const themeVersion = themePath ? (await stat(themePath)).mtimeMs : undefined;

  return {
    components: components.map((component) => ({
      ...component,
      export: component.export ?? "default",
      module: resolve(dirname(configPath), component.module),
    })),
    theme: themePath,
    themeVersion,
  };
};

export const createRegistryModule = async (documentPath) => {
  const { components: registry } = await loadSiteConfiguration(documentPath);
  const imports = registry.map((component, index) => {
    const importName = `component${index}`;
    const importPath = JSON.stringify(component.module);
    const importStatement =
      component.export === "default"
        ? `import ${importName} from ${importPath};`
        : `import { ${component.export} as ${importName} } from ${importPath};`;

    return { importName, importStatement, name: component.name };
  });

  const assignments = imports.map(({ importName, name }) => `${JSON.stringify(name)}: ${importName}`).join(",\n  ");

  return [
    `import { components as builtInComponents } from ${JSON.stringify(componentsModule)};`,
    ...imports.map(({ importStatement }) => importStatement),
    "export const components = {",
    "  ...builtInComponents,",
    assignments.length > 0 ? `  ${assignments},` : "",
    "};",
  ]
    .filter(Boolean)
    .join("\n");
};

export const resolveRuntimeModules = () => ({
  mdxReact: require.resolve("@mdx-js/react"),
  react: require.resolve("react"),
  reactDomClient: require.resolve("react-dom/client"),
  reactJsxDevRuntime: require.resolve("react/jsx-dev-runtime"),
  reactJsxRuntime: require.resolve("react/jsx-runtime"),
});
