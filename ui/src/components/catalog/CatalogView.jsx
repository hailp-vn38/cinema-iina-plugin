import { useEffect, useRef, useState } from "react";

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

function HistoryCardMenu({ onRemove }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="catalog-card-menu"
      ref={menuRef}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        className="catalog-card-menu-trigger"
        type="button"
        onClick={() => setIsOpen((value) => !value)}
      >
        ⋯
      </button>
      {isOpen && (
        <div className="catalog-card-menu-popover">
          <button
            className="catalog-card-menu-item"
            type="button"
            onClick={() => {
              onRemove();
              setIsOpen(false);
            }}
          >
            Xóa khỏi lịch sử
          </button>
        </div>
      )}
    </div>
  );
}

function formatUpdatedAt(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

export function CatalogView({
  mode,
  title,
  subtitle,
  items,
  sourceId,
  pagination,
  onLoadMore,
  onOpenDetail,
  isLoading,
  onRestoreHistory,
  onRemoveHistory,
  onClearHistory,
}) {
  const panelRef = useRef(null);
  const isHistoryMode = mode === "history";
  const hasMore =
    !isHistoryMode &&
    pagination &&
    pagination.currentPage &&
    pagination.totalPages &&
    pagination.currentPage < pagination.totalPages;

  function triggerLoadMore() {
    if (!hasMore || isLoading) {
      return;
    }
    onLoadMore();
  }

  useEffect(() => {
    if (!panelRef.current) {
      return;
    }

    panelRef.current.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }, [sourceId]);

  if (!items || items.length === 0) {
    return (
      <section className="panel" ref={panelRef}>
        <div className="catalog-panel-header">
          <div>
            <h2>{title}</h2>
            <p className="catalog-panel-subtitle">{subtitle}</p>
          </div>
          {isHistoryMode ? (
            <button
              className="ghost-button ghost-button--small"
              type="button"
              onClick={onClearHistory}
            >
              Xóa all lịch sử
            </button>
          ) : null}
        </div>
        <div className="empty-state">
          <p className="empty-state-message">
            {isHistoryMode
              ? "Chưa có lịch sử xem nào được lưu."
              : "Không có phim nào. Hãy thử tìm kiếm hoặc đổi nguồn."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel" ref={panelRef}>
      <div className="catalog-panel-header">
        <div>
          <h2>{title}</h2>
          <p className="catalog-panel-subtitle">{subtitle}</p>
        </div>
        {isHistoryMode ? (
          <button
            className="ghost-button ghost-button--small"
            type="button"
            onClick={onClearHistory}
          >
            Xóa all lịch sử
          </button>
        ) : null}
      </div>

      <div className="catalog-grid">
        {items.map((item) => (
          <article
            className="catalog-card catalog-card--interactive"
            key={item.id}
            onClick={() => onOpenDetail(item.slug, isHistoryMode ? item : undefined)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpenDetail(item.slug, isHistoryMode ? item : undefined);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <Poster item={item} />
            <div className="catalog-card-content">
              <div className="catalog-card-headline">
                <h3>{item.name}</h3>
                {isHistoryMode ? (
                  <div
                    className="catalog-card-headline-actions"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      className="catalog-card-icon-button"
                      type="button"
                      aria-label="Play playlist"
                      title="Play playlist"
                      onClick={() => onRestoreHistory(item)}
                    >
                      ▶
                    </button>
                    <HistoryCardMenu onRemove={() => onRemoveHistory(item.id)} />
                  </div>
                ) : null}
              </div>
              <p className="catalog-origin">
                {item.originName || "No original title"}
              </p>
              <div className="catalog-meta">
                {(isHistoryMode
                  ? [item.serverName, item.sourceLabel || item.sourceId, item.updatedAtLabel]
                  : [item.year, item.type, item.quality, item.lang]
                )
                  .filter(Boolean)
                  .map((part) => (
                    <span key={part}>{part}</span>
                  ))}
              </div>
              <p className="catalog-episode">
                {isHistoryMode
                  ? item.episodeName ||
                    "Tập " +
                      ((typeof item.episodeIndex === "number"
                        ? item.episodeIndex
                        : 0) + 1)
                  : item.episodeCurrent || "No episode info"}
              </p>
              {isHistoryMode ? (
                <p className="catalog-history-note">
                  Xem gần nhất: {formatUpdatedAt(item.updatedAt)}
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {hasMore && (
        <>
          <div
            className={
              isLoading ? "catalog-sentinel is-loading" : "catalog-sentinel"
            }
          >
            {isLoading ? (
              <div className="catalog-sentinel-loader" aria-live="polite">
                <div className="catalog-sentinel-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="catalog-sentinel-text">
                  Đang tải thêm phim...
                </span>
              </div>
            ) : null}
          </div>
          <div className="catalog-load-more">
            <button
              className="ghost-button"
              type="button"
              onClick={triggerLoadMore}
              disabled={isLoading}
            >
              {isLoading ? "Đang tải..." : "Tải thêm"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
