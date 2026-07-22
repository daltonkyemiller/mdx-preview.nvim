import { parseDiffFromFile } from "@pierre/diffs";
import { FileDiff } from "@pierre/diffs/react";
import { useEffect, useMemo, useState } from "react";

function getPreviewThemeType() {
  const theme = globalThis.document?.documentElement.dataset.theme;
  return theme === "light" || theme === "dark" ? theme : "system";
}

function usePreviewThemeType() {
  const [themeType, setThemeType] = useState(getPreviewThemeType);

  useEffect(() => {
    const root = globalThis.document.documentElement;
    const observer = new MutationObserver(() => setThemeType(getPreviewThemeType()));
    observer.observe(root, { attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return themeType;
}

export function Diff({ after, before, caption, filename = "file.txt", language, mode = "unified" }) {
  const themeType = usePreviewThemeType();
  const fileDiff = useMemo(() => {
    if (before === after) {
      return null;
    }

    const oldFile = { contents: before, lang: language, name: filename };
    const newFile = { contents: after, lang: language, name: filename };
    return parseDiffFromFile(oldFile, newFile);
  }, [after, before, filename, language]);

  if (!fileDiff) {
    return (
      <figure className="m-0 overflow-hidden rounded-[var(--radius)] border border-border bg-card">
        <p className="m-0 px-5 py-4 text-muted-foreground">No changes.</p>
        {caption ? <figcaption className="border-t border-border px-5 py-3 text-sm">{caption}</figcaption> : null}
      </figure>
    );
  }

  return (
    <figure className="m-0 overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      <FileDiff
        fileDiff={fileDiff}
        options={{
          diffStyle: mode,
          overflow: "scroll",
          themeType,
        }}
      />
      {caption ? <figcaption className="border-t border-border px-5 py-3 text-sm">{caption}</figcaption> : null}
    </figure>
  );
}
