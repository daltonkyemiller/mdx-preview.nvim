import { compile } from "@mdx-js/mdx";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { createRegistryModule, componentsModule, pluginRoot, resolveRuntimeModules } from "./registry.mjs";

const componentsVirtualModule = "virtual:mdx-preview-components";

const getQueryValue = (id, name) => new URLSearchParams(id.split("?", 2)[1]).get(name);

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

    const sourceDirectory = getQueryValue(id, "source");
    if (!sourceDirectory) {
      return source;
    }

    return `${source}\n@source "${pluginRoot}/components";\n@source "${sourceDirectory}";`;
  },
};

const componentRegistryPlugin = {
  name: "mdx-preview-component-registry",
  resolveId(id) {
    if (id.startsWith(componentsVirtualModule)) {
      return `\0${id}`;
    }

    return undefined;
  },
  async load(id) {
    if (!id.startsWith(`\0${componentsVirtualModule}`)) {
      return undefined;
    }

    const documentPath = getQueryValue(id, "file");
    if (!documentPath) {
      throw new Error("Missing file for the MDX component registry");
    }

    return createRegistryModule(documentPath);
  },
};

export const componentRegistryUrl = (documentPath) =>
  `${componentsVirtualModule}?file=${encodeURIComponent(documentPath)}`;

export const createMdxPreviewPlugins = () => [
  tailwindSourcePlugin,
  tailwindcss(),
  react(),
  mdxPlugin,
  componentRegistryPlugin,
];

export const createMdxPreviewAliases = () => {
  const runtimeModules = resolveRuntimeModules();

  return [
    { find: "mdx-preview/components", replacement: componentsModule },
    { find: /^react$/, replacement: runtimeModules.react },
    { find: /^react\/jsx-dev-runtime$/, replacement: runtimeModules.reactJsxDevRuntime },
    { find: /^react\/jsx-runtime$/, replacement: runtimeModules.reactJsxRuntime },
    { find: /^react-dom\/client$/, replacement: runtimeModules.reactDomClient },
    { find: /^@mdx-js\/react$/, replacement: runtimeModules.mdxReact },
  ];
};
