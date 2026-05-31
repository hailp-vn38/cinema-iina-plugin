function posterMarkup(item) {
  if (item.posterUrl) {
    return (
      <img
        className="catalog-poster"
        src={item.posterUrl}
        alt={item.name}
      />
    );
  }

  return <div className="catalog-poster catalog-poster--fallback">{item.name.slice(0, 1)}</div>;
}

export function CatalogView({ title, subtitle, items, sourceId }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>{title || "Catalog"}</h2>
        <span className="panel-note">{sourceId || "unknown source"}</span>
      </div>
      <p className="lede">{subtitle || "No subtitle"}</p>

      <div className="catalog-grid">
        {items.length ? (
          items.map((item) => (
            <article className="catalog-card" key={item.id}>
              {posterMarkup(item)}
              <div className="catalog-card-content">
                <h3>{item.name}</h3>
                <p>{item.originName || "No original title"}</p>
                <div className="catalog-meta">
                  {[item.year, item.type, item.quality, item.lang]
                    .filter(Boolean)
                    .map((part) => (
                      <span key={part}>{part}</span>
                    ))}
                </div>
                <p className="catalog-episode">{item.episodeCurrent || "No episode info"}</p>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">Không có item cho source hiện tại.</div>
        )}
      </div>
    </section>
  );
}
