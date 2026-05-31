import { useCallback } from "react";
import { UI_COMMANDS } from "@shared/contracts/commands.js";
import { iinaClient } from "../bridge/iinaClient.js";
import { useSourceProvider } from "./useSourceProvider.js";
import { useAppStore } from "../store/appStore.js";

function createRequestId(prefix) {
  return (
    prefix +
    "-" +
    Date.now() +
    "-" +
    Math.random().toString(36).slice(2, 8)
  );
}

export function useDetailActions() {
  const provider = useSourceProvider();
  const detail = useAppStore((state) => state.detail.data);
  const setStatus = useAppStore((state) => state.setStatus);
  const setDetailLoading = useAppStore((state) => state.setDetailLoading);
  const setDetailError = useAppStore((state) => state.setDetailError);
  const applyDetailPayload = useAppStore((state) => state.applyDetailPayload);
  const closeDetail = useAppStore((state) => state.closeDetail);
  const selectDetailServer = useAppStore((state) => state.selectDetailServer);
  const setPendingPlayRequest = useAppStore(
    (state) => state.setPendingPlayRequest,
  );
  const recordOutboundCommand = useAppStore(
    (state) => state.recordOutboundCommand,
  );
  const rememberHistoryEntry = useAppStore(
    (state) => state.rememberHistoryEntry,
  );

  const openDetail = useCallback(
    async (slug, options = {}) => {
      if (!provider || !provider.getDetail) {
        setDetailError("Source này chưa hỗ trợ detail.");
        return;
      }

      setDetailLoading("Đang lấy thông tin phim...");
      try {
        const payload = await provider.getDetail(slug);
        const historyEntry =
          options && options.historyEntry
            ? options.historyEntry
            : options && options.entries
              ? options
              : null;
        let nextPayload = payload;

        if (historyEntry) {
          const servers = Array.isArray(payload.servers) ? payload.servers : [];
          const matchedServerIndex = servers.findIndex(
            (server) =>
              server &&
              ((historyEntry.serverId && server.id === historyEntry.serverId) ||
                (historyEntry.serverName && server.name === historyEntry.serverName)),
          );
          const activeServerIndex = matchedServerIndex >= 0 ? matchedServerIndex : payload.activeServerIndex || 0;
          const activeServer = servers[activeServerIndex] || null;
          nextPayload = Object.assign({}, payload, {
            activeServerIndex,
            serverName: activeServer ? activeServer.name : payload.serverName,
            entries: activeServer && Array.isArray(activeServer.entries) ? activeServer.entries : payload.entries,
            historyEpisodeIndex:
              typeof historyEntry.episodeIndex === "number"
                ? historyEntry.episodeIndex
                : -1,
            historyEpisodeName: historyEntry.episodeName || "",
            historyServerId: historyEntry.serverId || "",
          });
        }
        applyDetailPayload(nextPayload);
      } catch (error) {
        setDetailError(
          error && error.message ? error.message : "Unknown provider error",
        );
      }
    },
    [applyDetailPayload, provider, setDetailError, setDetailLoading],
  );

  const playEpisode = useCallback(
    (episodeIndex) => {
      if (!provider || !provider.toPlaybackPayload || !detail) {
        setStatus("error", "Chưa có dữ liệu phát.");
        return;
      }

      try {
        const requestId = createRequestId("play-episode");
        const payload = provider.toPlaybackPayload(detail, {
          mode: "single",
          episodeIndex,
        });
        rememberHistoryEntry({
          sourceId: detail.sourceId,
          movieId: detail.movieId,
          detailSlug: detail.slug,
          title: detail.title,
          originName: detail.originName,
          posterUrl: detail.posterUrl,
          serverId: payload.serverId,
          serverName: detail.serverName,
          entries: payload.entries,
          episodeIndex,
          episodeName: payload.episodeName,
        });
        setPendingPlayRequest(requestId);
        recordOutboundCommand(UI_COMMANDS.PLAY_EPISODE);
        setStatus("loading", "Đang mở tập...");
        iinaClient.post(
          UI_COMMANDS.PLAY_EPISODE,
          Object.assign({}, payload, {
            requestId,
          }),
        );
      } catch (error) {
        setStatus(
          "error",
          error && error.message ? error.message : "Không phát được phim.",
        );
      }
    },
    [
      detail,
      provider,
      recordOutboundCommand,
      rememberHistoryEntry,
      setPendingPlayRequest,
      setStatus,
    ],
  );

  const playAll = useCallback(
    (startEpisodeIndex = 0) => {
      if (!provider || !provider.toPlaybackPayload || !detail) {
        setStatus("error", "Chưa có dữ liệu phát.");
        return;
      }

      try {
        const requestId = createRequestId("play-all");
        const payload = provider.toPlaybackPayload(detail, {
          mode: "all",
          startEpisodeIndex,
        });
        rememberHistoryEntry({
          sourceId: detail.sourceId,
          movieId: detail.movieId,
          detailSlug: detail.slug,
          title: detail.title,
          originName: detail.originName,
          posterUrl: detail.posterUrl,
          serverId: payload.serverId,
          serverName: detail.serverName,
          entries: payload.entries,
          startEpisodeIndex,
          episodeIndex: startEpisodeIndex,
          episodeName:
            payload.entries[startEpisodeIndex] &&
            payload.entries[startEpisodeIndex].name
              ? payload.entries[startEpisodeIndex].name
              : "",
        });
        setPendingPlayRequest(requestId);
        recordOutboundCommand(UI_COMMANDS.PLAY_ALL);
        setStatus("loading", "Đang thêm playlist...");
        iinaClient.post(
          UI_COMMANDS.PLAY_ALL,
          Object.assign({}, payload, {
            requestId,
          }),
        );
      } catch (error) {
        setStatus(
          "error",
          error && error.message ? error.message : "Không phát được playlist.",
        );
      }
    },
    [
      detail,
      provider,
      recordOutboundCommand,
      rememberHistoryEntry,
      setPendingPlayRequest,
      setStatus,
    ],
  );

  return {
    openDetail,
    closeDetail,
    selectServer: selectDetailServer,
    playEpisode,
    playAll,
  };
}
