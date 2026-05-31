import { useEffect, useRef } from "react";

function Poster({ item }) {
  if (item.posterUrl) {
    return (
      <img className="catalog-poster" src={item.posterUrl} alt={item.name} />
    );
  }

  return (
    <div className="catalog-poster catalog-poster--fallback">
      {(item.name || "?").slice(0, 1)}
    </div>
  );
}

export function CatalogView({
  items,
  pagination,
  onLoadMore,
  onOpenDetail,
  isLoading,
}) {
  const panelRef = useRef(null);
  const sentinelRef = useRef(null);
  const hasMore =
    pagination &&
    pagination.currentPage &&
    pagination.totalPages &&
    pagination.currentPage < pagination.totalPages;

  useEffect(() => {
    if (!hasMore || !sentinelRef.current || !panelRef.current || isLoading) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onLoadMore();
          }
        });
      },
      {
        root: panelRef.current,
        threshold: 0.1,
      },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  if (!items || items.length === 0) {
    return (
      <section className="panel" ref={panelRef}>
        <div className="empty-state">
          <p className="empty-state-message">
            Không có phim nào. Hãy thử tìm kiếm hoặc đổi nguồn.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel" ref={panelRef}>
      <div className="catalog-grid">
        {items.map((item) => (
          <article
            className="catalog-card catalog-card--interactive"
            key={item.id}
            onClick={() => onOpenDetail(item.slug)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpenDetail(item.slug);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <Poster item={item} />
            <div className="catalog-card-content">
              <h3>{item.name}</h3>
              <p className="catalog-origin">
                {item.originName || "No original title"}
              </p>
              <div className="catalog-meta">
                {[item.year, item.type, item.quality, item.lang]
                  .filter(Boolean)
                  .map((part) => (
                    <span key={part}>{part}</span>
                  ))}
              </div>
              <p className="catalog-episode">
                {item.episodeCurrent || "No episode info"}
              </p>
            </div>
          </article>
        ))}
      </div>

      {hasMore && (
        <div className={isLoading ? "catalog-sentinel is-loading" : "catalog-sentinel"}>
          <div ref={sentinelRef} className="catalog-sentinel-target" />
          {isLoading ? <span>Đang tải...</span> : null}
        </div>
      )}
    </section>
  );
}
