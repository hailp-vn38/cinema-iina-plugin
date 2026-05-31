export function StatusPanel({ status, message, connected, eventCount, lastEventName }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Status</h2>
        <span className="status-badge">{status}</span>
      </div>
      <p className="lede">{message || "No message yet."}</p>
      <div className="meta-grid">
        <div className="meta-item">
          <span className="meta-label">Connected</span>
          <strong>{connected ? "yes" : "no"}</strong>
        </div>
        <div className="meta-item">
          <span className="meta-label">Runtime events</span>
          <strong>{eventCount}</strong>
        </div>
        <div className="meta-item meta-item--wide">
          <span className="meta-label">Last event</span>
          <strong>{lastEventName || "none yet"}</strong>
        </div>
      </div>
    </section>
  );
}
