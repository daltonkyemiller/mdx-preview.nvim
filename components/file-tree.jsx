import { FileTree as PierreFileTree, useFileTree } from "@pierre/trees/react";

const gitStatusByChange = {
  added: "added",
  deleted: "deleted",
  modified: "modified",
  removed: "deleted",
  renamed: "renamed",
};

export function FileTree({ files, height = "20rem", title }) {
  const paths = files.map((file) => file.path);
  const gitStatus = files.flatMap((file) => {
    const status = gitStatusByChange[file.change];
    return status ? [{ path: file.path, status }] : [];
  });
  const { model } = useFileTree({
    gitStatus,
    initialExpansion: "open",
    paths,
  });

  return (
    <PierreFileTree
      aria-label={title ?? "File tree"}
      className="block overflow-hidden rounded-[var(--radius)] border border-border bg-card"
      header={title ? <strong>{title}</strong> : null}
      model={model}
      style={{
        "--trees-bg-override": "var(--card)",
        "--trees-border-color-override": "var(--border)",
        "--trees-fg-override": "var(--card-foreground)",
        "--trees-selected-bg-override": "var(--muted)",
        height,
      }}
    />
  );
}
