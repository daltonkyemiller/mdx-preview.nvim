import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { MDXProvider } from "@mdx-js/react";
import "./styles.css";

const POLL_INTERVAL_MS = 500;
const componentRegistryUrl = (file) => `/@id/virtual:mdx-preview-components?file=${encodeURIComponent(file)}`;

function Preview() {
  const [document, setDocument] = useState(null);
  const [components, setComponents] = useState({});
  const [error, setError] = useState(null);

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

  if (error) {
    return <pre className="error">{error}</pre>;
  }

  if (!document) {
    return <p>Loading preview…</p>;
  }

  const Document = document;
  return (
    <MDXProvider components={components}>
      <Document />
    </MDXProvider>
  );
}

createRoot(document.getElementById("root")).render(<Preview />);
