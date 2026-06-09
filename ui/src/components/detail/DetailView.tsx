import type { ReactElement } from "react";
import type { PlaybackState } from "../../store/types";
import type { ProviderDetail, ProviderEntry, ProviderServer } from "@shared/contracts/models";

interface DetailPosterProps {
  detail: ProviderDetail;
}

function DetailPoster({ detail }: DetailPosterProps): ReactElement {
  if (detail.posterUrl) {
    return <img className="detail-poster" src={detail.posterUrl} alt={detail.title} />;
  }

  return (
    <div className="detail-poster detail-poster--fallback">
      {(detail.title || "?").slice(0, 1)}
    </div>
  );
}

interface DetailViewProps {
  detail: ProviderDetail;
  playback: PlaybackState;
  onBack: () => void;
  onSelectServer: (index: number) => void;
  onPlayEpisode: (episodeIndex: number) => void;
  onPlayAll: (startEpisodeIndex?: number) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export function DetailView({
  detail,
  playback,
  onBack,
  onSelectServer,
  onPlayEpisode,
  onPlayAll,
  isFavorite,
  onToggleFavorite,
}: DetailViewProps): ReactElement {
  const servers: ProviderServer[] = Array.isArray(detail.servers)
    ? detail.servers
    : [];
  const activeServerIndex =
    typeof detail.activeServerIndex === "number" ? detail.activeServerIndex : 0;
  const activeServer = servers[activeServerIndex] || null;
  const activeEntries: ProviderEntry[] = Array.isArray(detail.entries)
    ? detail.entries
    : activeServer && Array.isArray(activeServer.entries)
      ? activeServer.entries
      : [];

  const isCurrentDetail =
    playback.active && playback.detailSlug && playback.detailSlug === detail.slug;
  const lastKnownEpisodeIndex =
    typeof detail.historyEpisodeIndex === "number"
      ? detail.historyEpisodeIndex
      : -1;
  const lastKnownEpisodeName = detail.historyEpisodeName || "";

  return (
    <section className="panel">
      <article className="detail-card">
        <div className="detail-toolbar">
          <button className="ghost-button" type="button" onClick={onBack}>
            Quay lại
          </button>
          <div className="detail-toolbar-actions">
            <button
              className={
                isFavorite
                  ? "favorite-button is-active"
                  : "favorite-button"
              }
              type="button"
              aria-label={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
              title={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
              onClick={onToggleFavorite}
            >
              {isFavorite ? "♥" : "♡"}
            </button>
            <button
              className="primary-button"
              type="button"
              onClick={() => onPlayAll(0)}
            >
              Play all
            </button>
          </div>
        </div>

        <div className="detail-hero">
          <DetailPoster detail={detail} />
          <div className="detail-content">
            <h3 className="detail-title">{detail.title}</h3>
            <p className="detail-origin">{detail.originName}</p>

            <div className="detail-meta">
              {[detail.year, detail.quality, detail.lang, detail.time]
                .filter(Boolean)
                .map((part) => (
                  <span className="detail-meta-pill" key={part}>
                    {part}
                  </span>
                ))}
            </div>

            <p className="detail-server">
              Server:{" "}
              {(activeServer && activeServer.name) ||
                detail.serverName ||
                "Mặc định"}
            </p>

            {isCurrentDetail ? (
              <p className="detail-now-playing">
                Đang xem:{" "}
                {playback.episodeName
                  ? detail.title + " - " + playback.episodeName
                  : playback.title || detail.title}
              </p>
            ) : lastKnownEpisodeIndex >= 0 ? (
              <p className="detail-now-playing">
                Lần cuối:{" "}
                {lastKnownEpisodeName
                  ? detail.title + " - " + lastKnownEpisodeName
                  : detail.title + " - Tập " + (lastKnownEpisodeIndex + 1)}
              </p>
            ) : null}

            <p className="detail-summary">
              {detail.content || detail.episodeCurrent || "Không có mô tả."}
            </p>
          </div>
        </div>

        <div className="server-section">
          <div className="episode-section-header">
            <h4 className="episode-section-title">Server</h4>
          </div>
          <div className="chip-row">
            {servers.map((server, index) => (
              <button
                key={server.id || server.name || index}
                className={index === activeServerIndex ? "chip is-active" : "chip"}
                type="button"
                onClick={() => onSelectServer(index)}
              >
                {server.name}
              </button>
            ))}
          </div>
        </div>

        <div className="episode-section">
          <div className="episode-section-header">
            <h4 className="episode-section-title">Danh sách tập</h4>
            <span className="episode-section-count">{activeEntries.length} tập</span>
          </div>

          <div className="episode-grid">
            {activeEntries.map((entry, index) => {
              const isCurrent = isCurrentDetail && playback.episodeIndex === index;
              const isFavoriteProgressCurrent =
                !isCurrentDetail && lastKnownEpisodeIndex === index;
              return (
                <button
                  key={entry.slug || entry.name || index}
                  className={
                    isCurrent || isFavoriteProgressCurrent
                      ? "episode-button is-current"
                      : "episode-button"
                  }
                  type="button"
                  onClick={() => onPlayEpisode(index)}
                >
                  {entry.name || "Tập " + (index + 1)}
                </button>
              );
            })}
          </div>
        </div>
      </article>
    </section>
  );
}
