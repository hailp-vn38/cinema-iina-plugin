import { useCallback } from "react";
import type {
  PlayAllCommand,
  PlayEpisodeCommand,
  ProviderDetail,
  ProviderServer,
} from "@shared/contracts/models";
import { UI_COMMANDS } from "@shared/contracts/commands";
import { iinaClient } from "../bridge/iinaClient";
import { useSourceProvider } from "./useSourceProvider";
import { useAppStore } from "../store/appStore";
import type { FavoriteEntry, FavoriteEntryInput } from "../store/types";

function createRequestId(prefix: string): string {
  return (
    prefix +
    "-" +
    Date.now() +
    "-" +
    Math.random().toString(36).slice(2, 8)
  );
}

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export interface OpenDetailOptions extends Partial<FavoriteEntry> {
  favoriteEntry?: FavoriteEntry;
}

export interface DetailActions {
  openDetail: (slug: string, options?: OpenDetailOptions) => Promise<void>;
  closeDetail: () => void;
  selectServer: (index: number) => void;
  playEpisode: (episodeIndex: number) => void;
  playAll: (startEpisodeIndex?: number) => void;
  toggleFavorite: () => void;
}

function toFavoriteEntryId(payload: Pick<FavoriteEntryInput, "sourceId" | "detailSlug">): string {
  return [
    payload.sourceId ? payload.sourceId : "",
    payload.detailSlug ? payload.detailSlug : "",
  ].join(":");
}

export function useDetailActions(): DetailActions {
  const provider = useSourceProvider();
  const detail = useAppStore((state) => state.detail.data);
  const favorites = useAppStore((state) => state.favorites);
  const playback = useAppStore((state) => state.playback);
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
  const toggleFavoriteEntry = useAppStore(
    (state) => state.toggleFavoriteEntry,
  );
  const updateFavoriteProgress = useAppStore(
    (state) => state.updateFavoriteProgress,
  );

  const openDetail = useCallback(
    async (slug: string, options: OpenDetailOptions = {}): Promise<void> => {
      if (!provider || !provider.getDetail) {
        setDetailError("Source này chưa hỗ trợ detail.");
        return;
      }

      setDetailLoading("Đang lấy thông tin phim...");
      try {
        const payload = await provider.getDetail(slug);
        const matchedFavoriteEntry =
          options.favoriteEntry
            ? options.favoriteEntry
            : options.entries
              ? (options as FavoriteEntry)
              : favorites.find(
                  (item) =>
                    item.sourceId === payload.sourceId &&
                    item.detailSlug === payload.slug,
                ) || null;
        let nextPayload: ProviderDetail = payload;

        if (matchedFavoriteEntry) {
          const servers: ProviderServer[] = Array.isArray(payload.servers)
            ? payload.servers
            : [];
          const matchedServerIndex = servers.findIndex(
            (server) =>
              (matchedFavoriteEntry.serverId &&
                server.id === matchedFavoriteEntry.serverId) ||
              (matchedFavoriteEntry.serverName &&
                server.name === matchedFavoriteEntry.serverName),
          );
          const activeServerIndex =
            matchedServerIndex >= 0
              ? matchedServerIndex
              : payload.activeServerIndex || 0;
          const activeServer = servers[activeServerIndex] || null;
          nextPayload = {
            ...payload,
            activeServerIndex,
            serverName: activeServer ? activeServer.name : payload.serverName,
            entries:
              activeServer && Array.isArray(activeServer.entries)
                ? activeServer.entries
                : payload.entries,
            historyEpisodeIndex:
              typeof matchedFavoriteEntry.episodeIndex === "number"
                ? matchedFavoriteEntry.episodeIndex
                : -1,
            historyEpisodeName: matchedFavoriteEntry.episodeName || "",
            historyServerId: matchedFavoriteEntry.serverId || "",
          };
        }
        applyDetailPayload(nextPayload);
      } catch (error) {
        setDetailError(toErrorMessage(error, "Unknown provider error"));
      }
    },
    [applyDetailPayload, favorites, provider, setDetailError, setDetailLoading],
  );

  const playEpisode = useCallback(
    (episodeIndex: number): void => {
      if (!provider || !provider.toPlaybackPayload || !detail) {
        setStatus("error", "Chưa có dữ liệu phát.");
        return;
      }

      try {
        const requestId = createRequestId("play-episode");
        const payload = provider.toPlaybackPayload(detail, {
          mode: "single",
          episodeIndex,
        }) as PlayEpisodeCommand;
        updateFavoriteProgress({
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
        iinaClient.post(UI_COMMANDS.PLAY_EPISODE, {
          ...payload,
          requestId,
        });
      } catch (error) {
        setStatus("error", toErrorMessage(error, "Không phát được phim."));
      }
    },
    [
      detail,
      provider,
      recordOutboundCommand,
      setPendingPlayRequest,
      setStatus,
      updateFavoriteProgress,
    ],
  );

  const playAll = useCallback(
    (startEpisodeIndex = 0): void => {
      if (!provider || !provider.toPlaybackPayload || !detail) {
        setStatus("error", "Chưa có dữ liệu phát.");
        return;
      }

      try {
        const requestId = createRequestId("play-all");
        const payload = provider.toPlaybackPayload(detail, {
          mode: "all",
          startEpisodeIndex,
        }) as PlayAllCommand;
        updateFavoriteProgress({
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
        iinaClient.post(UI_COMMANDS.PLAY_ALL, {
          ...payload,
          requestId,
        });
      } catch (error) {
        setStatus(
          "error",
          toErrorMessage(error, "Không phát được playlist."),
        );
      }
    },
    [
      detail,
      provider,
      recordOutboundCommand,
      setPendingPlayRequest,
      setStatus,
      updateFavoriteProgress,
    ],
  );

  const toggleFavorite = useCallback((): void => {
    if (!detail) {
      setStatus("error", "Chưa có dữ liệu phim để lưu yêu thích.");
      return;
    }

    const servers: ProviderServer[] = Array.isArray(detail.servers)
      ? detail.servers
      : [];
    const activeServerIndex =
      typeof detail.activeServerIndex === "number" ? detail.activeServerIndex : 0;
    const activeServer = servers[activeServerIndex] || null;
    const entries =
      activeServer && Array.isArray(activeServer.entries)
        ? activeServer.entries
        : Array.isArray(detail.entries)
          ? detail.entries
          : [];
    const favoriteId = toFavoriteEntryId({
      sourceId: detail.sourceId,
      detailSlug: detail.slug,
    });
    const existingFavorite = favorites.find((item) => item.id === favoriteId);
    const isCurrentPlayback =
      playback.active &&
      playback.sourceId === detail.sourceId &&
      playback.detailSlug === detail.slug;
    const episodeIndex = isCurrentPlayback
      ? playback.episodeIndex
      : typeof existingFavorite?.episodeIndex === "number"
        ? existingFavorite.episodeIndex
        : 0;

    toggleFavoriteEntry({
      sourceId: detail.sourceId,
      movieId: detail.movieId,
      detailSlug: detail.slug,
      title: detail.title,
      originName: detail.originName,
      posterUrl: detail.posterUrl,
      serverId: (activeServer && activeServer.id) || detail.historyServerId || "",
      serverName: (activeServer && activeServer.name) || detail.serverName,
      entries,
      episodeIndex,
      episodeName:
        isCurrentPlayback && playback.episodeName
          ? playback.episodeName
          : existingFavorite?.episodeName || entries[episodeIndex]?.name || "",
    });
  }, [detail, favorites, playback, setStatus, toggleFavoriteEntry]);

  return {
    openDetail,
    closeDetail,
    selectServer: selectDetailServer,
    playEpisode,
    playAll,
    toggleFavorite,
  };
}
