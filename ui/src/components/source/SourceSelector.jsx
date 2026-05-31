export function SourceSelector({ sources, activeSourceId, onChange }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Source Selector</h2>
        <span className="panel-note">Phase 4 shell only</span>
      </div>
      <div className="source-grid">
        {sources.map((source) => {
          const isActive = source.id === activeSourceId;
          return (
            <button
              key={source.id}
              type="button"
              className={isActive ? "source-button is-active" : "source-button"}
              onClick={() => onChange(source.id)}
              disabled={!source.enabled}
            >
              <span>{source.label}</span>
              <small>{source.enabled ? "enabled" : "coming later"}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
