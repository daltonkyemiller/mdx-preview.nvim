import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const registryDirectory = join(
  process.env.XDG_STATE_HOME ?? join(homedir(), ".local", "state"),
  "mdx-preview",
  "servers"
);
const requestTimeoutMs = 500;

const isServerRecord = (record) =>
  typeof record === "object" &&
  record !== null &&
  typeof record.file === "string" &&
  typeof record.id === "string" &&
  typeof record.port === "number" &&
  typeof record.token === "string";

const recordPath = (directory, id) => join(directory, `${id}.json`);

const readServerRecords = async (directory) => {
  try {
    const names = await readdir(directory);
    const records = await Promise.all(
      names.map(async (name) => {
        const path = join(directory, name);
        try {
          const record = JSON.parse(await readFile(path, "utf8"));
          return isServerRecord(record) ? { path, record } : undefined;
        } catch {
          await rm(path, { force: true });
          return undefined;
        }
      })
    );
    return records.filter(Boolean);
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
};

const requestServer = async (record, path, options = {}) => {
  try {
    return await fetch(`http://localhost:${record.port}${path}`, {
      ...options,
      headers: { "x-mdx-preview-token": record.token, ...options.headers },
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
  } catch {
    return undefined;
  }
};

export const registerPreviewServer = async ({ directory = registryDirectory, ...record }) => {
  await mkdir(directory, { recursive: true });
  const path = recordPath(directory, record.id);
  await writeFile(path, JSON.stringify(record));

  return async () => rm(path, { force: true });
};

export const listPreviewServers = async ({ directory = registryDirectory } = {}) => {
  const records = await readServerRecords(directory);
  const activeRecords = await Promise.all(
    records.map(async ({ path, record }) => {
      const response = await requestServer(record, "/api/status");
      if (response?.ok) {
        return record;
      }

      await rm(path, { force: true });
      return undefined;
    })
  );

  return activeRecords.filter(Boolean);
};

export const stopPreviewServers = async ({ directory = registryDirectory } = {}) => {
  const records = await readServerRecords(directory);
  const stoppedRecords = await Promise.all(
    records.map(async ({ path, record }) => {
      const response = await requestServer(record, "/api/stop", { method: "POST" });
      if (!response?.ok) {
        await rm(path, { force: true });
        return undefined;
      }

      await rm(path, { force: true });
      return record;
    })
  );

  return stoppedRecords.filter(Boolean);
};
