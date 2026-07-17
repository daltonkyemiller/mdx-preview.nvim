import { Button } from "./ui/button.jsx";
import { Diagram } from "./diagram.jsx";

const panelClassName = "border border-border bg-card p-5 text-card-foreground sm:p-6";
const kickerClassName = "mb-3 font-geist-pixel text-[10px] tracking-[0.2em] text-muted-foreground uppercase";
const listClassName = "grid list-none border-y border-border p-0";

export function Callout({ children, title = "Note", tone = "info" }) {
  const toneClassNames = {
    danger: "border-destructive/45 bg-destructive/10",
    info: "border-primary/35 bg-primary/[0.07]",
    warning: "border-warning/45 bg-warning/10",
  };

  return (
    <aside className={`${panelClassName} ${toneClassNames[tone] ?? toneClassNames.info}`}>
      <p className={kickerClassName}>{title}</p>
      <div className="[&>:first-child]:mt-0 [&>:last-child]:mb-0">{children}</div>
    </aside>
  );
}

export function Flow({ steps }) {
  return (
    <ol className={listClassName}>
      {steps.map((step, index) => (
        <li className="grid grid-cols-[3rem_1fr] gap-4 border-b border-border py-4 last:border-b-0" key={step.title}>
          <span className="font-geist-pixel text-xs tracking-[0.12em] text-muted-foreground">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <strong>{step.title}</strong>
            {step.detail ? <p className="mb-0 text-muted-foreground">{step.detail}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Comparison({ left, right }) {
  return (
    <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
      <section className={`${panelClassName} border-0`}>
        <p className={kickerClassName}>{left.label}</p>
        <h2>{left.title}</h2>
        <p>{left.detail}</p>
      </section>
      <section className={`${panelClassName} border-0`}>
        <p className={kickerClassName}>{right.label}</p>
        <h2>{right.title}</h2>
        <p>{right.detail}</p>
      </section>
    </div>
  );
}

export function FileMap({ files }) {
  return (
    <ul className={listClassName}>
      {files.map((file) => (
        <li
          className="grid gap-1 border-b border-border py-4 last:border-b-0 sm:grid-cols-[minmax(10rem,0.7fr)_1fr] sm:gap-4"
          key={file.path}
        >
          <code className="text-sm text-foreground">{file.path}</code>
          {file.detail ? <span className="text-muted-foreground">{file.detail}</span> : null}
        </li>
      ))}
    </ul>
  );
}

export function Decision({ title, rationale, status = "Recommended" }) {
  return (
    <section className={panelClassName}>
      <p className={kickerClassName}>{status}</p>
      <h2>{title}</h2>
      <p>{rationale}</p>
    </section>
  );
}

export function Timeline({ events }) {
  return (
    <ol className={listClassName}>
      {events.map((event) => (
        <li
          className="grid gap-1 border-b border-border py-4 last:border-b-0 sm:grid-cols-[9rem_1fr] sm:gap-4"
          key={event.title}
        >
          <p className={`${kickerClassName} mb-0`}>{event.label}</p>
          <div>
            <strong>{event.title}</strong>
            {event.detail ? <p className="mb-0 text-muted-foreground">{event.detail}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Metric({ label, value, detail }) {
  return (
    <section className={panelClassName}>
      <p className={kickerClassName}>{label}</p>
      <strong className="block font-mondwest text-5xl leading-none font-normal tracking-tight sm:text-7xl">
        {value}
      </strong>
      {detail ? <p className="mb-0 text-muted-foreground">{detail}</p> : null}
    </section>
  );
}

export function Architecture({ nodes }) {
  return (
    <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-[repeat(auto-fit,minmax(15rem,1fr))]">
      {nodes.map((node) => (
        <section className={`${panelClassName} border-0`} key={node.title}>
          <p className={kickerClassName}>{node.label}</p>
          <strong>{node.title}</strong>
          {node.detail ? <p className="mb-0 text-muted-foreground">{node.detail}</p> : null}
        </section>
      ))}
    </div>
  );
}

export function CodeBlock({ children, language = "text", title }) {
  return (
    <section className="overflow-hidden border border-border bg-card">
      <header className="border-b border-border px-4 py-2.5 font-geist-pixel text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
        <span>{title ?? language}</span>
      </header>
      <pre className="m-0 overflow-auto border-0 bg-transparent p-4">
        <code>{children}</code>
      </pre>
    </section>
  );
}

export const components = {
  Architecture,
  Button,
  Callout,
  CodeBlock,
  Comparison,
  Decision,
  Diagram,
  FileMap,
  Flow,
  Metric,
  Timeline,
};
