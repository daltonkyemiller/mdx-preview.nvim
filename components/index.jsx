import "./styles.css";

export function Callout({ children, title = "Note", tone = "info" }) {
  return (
    <aside className={`mdx-callout mdx-callout--${tone}`}>
      <p className="mdx-callout__title">{title}</p>
      <div>{children}</div>
    </aside>
  );
}

export function Flow({ steps }) {
  return (
    <ol className="mdx-flow">
      {steps.map((step, index) => (
        <li className="mdx-flow__step" key={step.title}>
          <span className="mdx-flow__number">{String(index + 1).padStart(2, "0")}</span>
          <div>
            <strong>{step.title}</strong>
            {step.detail ? <p>{step.detail}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Comparison({ left, right }) {
  return (
    <div className="mdx-comparison">
      <section>
        <p className="mdx-kicker">{left.label}</p>
        <h2>{left.title}</h2>
        <p>{left.detail}</p>
      </section>
      <section>
        <p className="mdx-kicker">{right.label}</p>
        <h2>{right.title}</h2>
        <p>{right.detail}</p>
      </section>
    </div>
  );
}

export function FileMap({ files }) {
  return (
    <ul className="mdx-file-map">
      {files.map((file) => (
        <li key={file.path}>
          <code>{file.path}</code>
          {file.detail ? <span>{file.detail}</span> : null}
        </li>
      ))}
    </ul>
  );
}

export function Decision({ title, rationale, status = "Recommended" }) {
  return (
    <section className="mdx-decision">
      <p className="mdx-kicker">{status}</p>
      <h2>{title}</h2>
      <p>{rationale}</p>
    </section>
  );
}

export function Timeline({ events }) {
  return (
    <ol className="mdx-timeline">
      {events.map((event) => (
        <li key={event.title}>
          <p className="mdx-kicker">{event.label}</p>
          <strong>{event.title}</strong>
          {event.detail ? <p>{event.detail}</p> : null}
        </li>
      ))}
    </ol>
  );
}

export function Metric({ label, value, detail }) {
  return (
    <section className="mdx-metric">
      <p className="mdx-kicker">{label}</p>
      <strong>{value}</strong>
      {detail ? <p>{detail}</p> : null}
    </section>
  );
}

export function Architecture({ nodes }) {
  return (
    <div className="mdx-architecture">
      {nodes.map((node) => (
        <section key={node.title}>
          <p className="mdx-kicker">{node.label}</p>
          <strong>{node.title}</strong>
          {node.detail ? <p>{node.detail}</p> : null}
        </section>
      ))}
    </div>
  );
}

export function CodeBlock({ children, language = "text", title }) {
  return (
    <section className="mdx-code-block">
      <header>
        <span>{title ?? language}</span>
      </header>
      <pre>
        <code>{children}</code>
      </pre>
    </section>
  );
}

export const components = {
  Architecture,
  Callout,
  CodeBlock,
  Comparison,
  Decision,
  FileMap,
  Flow,
  Metric,
  Timeline,
};
