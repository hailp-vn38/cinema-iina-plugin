export function DiagnosticPanel({ diagnostic }) {
  const rows = [
    ["pluginVersion", diagnostic.pluginVersion],
    ["sidebarLoaded", diagnostic.sidebarLoaded ? "yes" : "no"],
    ["windowLoaded", diagnostic.windowLoaded ? "yes" : "no"],
    ["lastUiMessage", diagnostic.lastUiMessage],
    ["lastAppMessage", diagnostic.lastAppMessage],
    ["lastError", diagnostic.lastError],
  ];

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Diagnostic</h2>
      </div>
      <div className="diagnostic-grid">
        {rows.map(([key, value]) => {
          return (
            <div className="diagnostic-row" key={key}>
              <span className="diagnostic-key">{key}</span>
              <span className="diagnostic-value">{value || "-"}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
