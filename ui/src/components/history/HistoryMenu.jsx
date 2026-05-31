import { useEffect, useRef, useState } from "react";

function formatTime(value) {
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

export function HistoryMenu({ history, onRestore, onRemove }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="history-menu" ref={containerRef}>
      <button
        className="dropdown-trigger history-menu-trigger"
        type="button"
        onClick={() => setIsOpen((value) => !value)}
      >
        <span>Lịch sử</span>
        <span className="history-count">{history.length}</span>
      </button>

      {isOpen && (
        <div className="history-popover">
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Phim</th>
                  <th>Tập</th>
                  <th>Lúc xem</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {history.length ? (
                  history.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="history-title">{item.title}</div>
                        <div className="history-subtitle">
                          {item.serverName || item.sourceId || ""}
                        </div>
                      </td>
                      <td>{item.episodeName || item.episodeIndex + 1}</td>
                      <td>{formatTime(item.updatedAt)}</td>
                      <td className="history-actions-cell">
                        <button
                          className="ghost-button ghost-button--small"
                          type="button"
                          onClick={() => {
                            onRestore(item);
                            setIsOpen(false);
                          }}
                        >
                          Restore
                        </button>
                        <button
                          className="ghost-button ghost-button--small"
                          type="button"
                          onClick={() => onRemove(item.id)}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="history-empty">
                      Chưa có playlist nào được lưu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
