import { useRef, useEffect } from "react";

function posterMarkup(item) {
  if (item.posterUrl) {
    return (
      <img className="catalog-poster" src={item.posterUrl} alt={item.name} />
    );
  }

  return (
    <div className="catalog-poster catalog-poster--fallback">
      {item.name.slice(0, 1)}
    </div>
  );
}

export function CatalogView({
  title,
  subtitle,
  items,
  sourceId,
  pagination,
  onLoadMore,
  isLoading,
}) {
  const sentinelRef = useRef(null);
  const hasMore =
    pagination &&
    pagination.currentPage &&
    pagination.totalPages &&
    pagination.currentPage < pagination.totalPages;

  console.log(
    "[CatalogView] hasMore:",
    hasMore,
    "pagination:",
    pagination,
    "isLoading:",
    isLoading,
  );

  // Auto-load more when user scrolls to bottom
  useEffect(() => {
    console.log(
      "[CatalogView] Setting up IntersectionObserver, hasMore:",
      hasMore,
      "sentinelRef.current:",
      sentinelRef.current ? "present" : "missing",
      "isLoading:",
      isLoading,
    );

    if (!hasMore || !sentinelRef.current || isLoading) {
      console.log(
        "[CatalogView] Skipping observer setup: hasMore=" +
          hasMore +
          ", sentinel=" +
          (sentinelRef.current ? "yes" : "no") +
          ", loading=" +
          isLoading,
      );
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          console.log("[CatalogView] Observer entry:", {
            isIntersecting: entry.isIntersecting,
            ratio: entry.intersectionRatio,
          });
          if (entry.isIntersecting) {
            console.log("[CatalogView] Sentinel visible, triggering loadMore");
            onLoadMore();
          }
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, onLoadMore, isLoading]);

  if (!items || items.length === 0) {
    return (
      <section className="panel">
        <div className="panel-header">
          <h2>{title || "Catalog"}</h2>
          <span className="panel-note">{sourceId || "unknown source"}</span>
        </div>
        <p className="lede">{subtitle || "No items"}</p>
        <div className="empty-state">
          <p
            style={{
              padding: "20px",
              textAlign: "center",
              color: "var(--ink-soft)",
            }}
          >
            Không có phim nào. Hãy thử tìm kiếm hoặc đổi nguồn.
          </p>
        </div>
      </section>
    );
  }

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
                <p className="catalog-episode">
                  {item.episodeCurrent || "No episode info"}
                </p>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">Không có item cho source hiện tại.</div>
        )}
      </div>

      {/* Sentinel for infinite scroll detection */}
      {hasMore && (
        <div
          ref={sentinelRef}
          style={{
            marginTop: "16px",
            padding: "16px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            backgroundColor: isLoading
              ? "rgba(139, 60, 29, 0.08)"
              : "transparent",
            borderRadius: "12px",
            border: isLoading ? "1px solid var(--line)" : "none",
            transition: "all 0.2s ease",
          }}
        >
          {isLoading && (
            <>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "var(--accent)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "var(--accent)",
                  animation: "pulse 1.5s ease-in-out infinite 0.3s",
                }}
              />
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "var(--accent)",
                  animation: "pulse 1.5s ease-in-out infinite 0.6s",
                }}
              />
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--accent)",
                  marginLeft: "8px",
                  fontWeight: "600",
                }}
              >
                Đang tải...
              </span>
              <style>{`
                @keyframes pulse {
                  0%, 100% { opacity: 0.3; }
                  50% { opacity: 1; }
                }
              `}</style>
            </>
          )}
        </div>
      )}
    </section>
  );
}
