import { fileURLToPath } from "node:url";
import { startPreviewSession } from "./preview-session.mjs";

const argumentValue = (name) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const session = await startPreviewSession({
    file: argumentValue("--file"),
    port: Number(argumentValue("--port") ?? 4321),
    statePath: argumentValue("--state"),
  });
  console.log(`MDX_PREVIEW_URL=${session.url}`);
}
