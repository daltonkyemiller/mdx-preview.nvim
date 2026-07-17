import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { MDXProvider } from "@mdx-js/react";
import { Button } from "../../components/ui/button.jsx";
import "./styles.css";

const POLL_INTERVAL_MS = 500;
const componentRegistryUrl = (file) => `/@id/virtual:mdx-preview-components?file=${encodeURIComponent(file)}`;
const THEME_STORAGE_KEY = "mdx-preview-theme";
const initialTheme = () => globalThis.localStorage?.getItem(THEME_STORAGE_KEY) ?? "system";

function Preview() {
  const [document, setDocument] = useState(null);
  const [documentName, setDocumentName] = useState(null);
  const [components, setComponents] = useState({});
  const [error, setError] = useState(null);
  const [exportStatus, setExportStatus] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    const root = globalThis.document.documentElement;
    if (theme === "system") {
      root.removeAttribute("data-theme");
      globalThis.localStorage.removeItem(THEME_STORAGE_KEY);
      return;
    }

    root.dataset.theme = theme;
    globalThis.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    let active = true;
    let currentDocument;

    const loadDocument = async () => {
      try {
        const response = await fetch("/api/document");
        const nextDocument = await response.json();
        if (!response.ok) {
          throw new Error(nextDocument.error);
        }
        const nextDocumentKey = `${nextDocument.file}:${nextDocument.version}`;
        if (nextDocumentKey === currentDocument) {
          return;
        }

        currentDocument = nextDocumentKey;
        await import(
          /* @vite-ignore */ `/src/tailwind.css?source=${encodeURIComponent(nextDocument.directory)}&t=${nextDocument.version}`
        );
        const registry = await import(/* @vite-ignore */ componentRegistryUrl(nextDocument.file));
        const module = await import(
          /* @vite-ignore */ `/@fs/${nextDocument.file}?mdx-preview&t=${nextDocument.version}`
        );
        if (active) {
          setDocument(() => module.default);
          setDocumentName(nextDocument.name);
          setComponents(registry.components);
          setError(null);
        }
      } catch (nextError) {
        if (active) {
          setError(nextError instanceof Error ? nextError.message : String(nextError));
        }
      }
    };

    void loadDocument();
    const intervalId = window.setInterval(() => void loadDocument(), POLL_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const exportHtml = async () => {
    setIsExporting(true);
    setExportStatus(null);

    try {
      const response = await fetch("/api/export", { method: "POST" });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error ?? "Could not export this document");
      }

      const html = await response.blob();
      const url = URL.createObjectURL(html);
      const anchor = globalThis.document.createElement("a");
      anchor.href = url;
      anchor.download = `${documentName?.replace(/\.(md|mdx)$/i, "") ?? "mdx-preview"}.html`;
      anchor.click();
      URL.revokeObjectURL(url);
      setExportStatus("Downloaded standalone HTML.");
    } catch (nextError) {
      setExportStatus(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setIsExporting(false);
    }
  };

  if (error) {
    return <pre className="error">{error}</pre>;
  }

  if (!document) {
    return <p>Loading preview…</p>;
  }

  const Document = document;
  return (
    <div className="preview-shell">
      <header className="preview-toolbar">
        <p className="preview-toolbar__label">MDX preview</p>
        <div className="preview-toolbar__actions">
          <div aria-label="Color theme" className="preview-theme-control" role="group">
            {[
              ["system", "System"],
              ["light", "Light"],
              ["dark", "Dark"],
            ].map(([value, label]) => (
              <Button
                aria-pressed={theme === value}
                className="aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
                key={value}
                onClick={() => setTheme(value)}
                size="small"
                type="button"
                variant="outline"
              >
                {label}
              </Button>
            ))}
          </div>
          {exportStatus ? (
            <span aria-live="polite" className="preview-toolbar__status">
              {exportStatus}
            </span>
          ) : null}
          <Button disabled={isExporting} onClick={exportHtml} size="small" type="button">
            {isExporting ? "Exporting…" : "Export HTML"}
          </Button>
        </div>
      </header>
      <main className="document-frame">
        <MDXProvider components={components}>
          <Document />
        </MDXProvider>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<Preview />);
