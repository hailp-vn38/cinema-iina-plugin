import { useCallback } from "react";
import { UI_COMMANDS } from "@shared/contracts/commands";
import { iinaClient } from "../bridge/iinaClient";
import { useAppStore } from "../store/appStore";
import type { FavoriteEntry } from "../store/types";

function createRequestId(prefix: string): string {
  return (
    prefix +
    "-" +
    Date.now() +
    "-" +
    Math.random().toString(36).slice(2, 8)
  );
}

export interface FavoriteActions {
  restoreFavoriteEntry: (entry: FavoriteEntry) => void;
  removeFavorite: (entryId: string) => void;
  clearFavorites: () => void;
}

export function useFavoriteActions(): FavoriteActions {
  const setStatus = useAppStore((state) => state.setStatus);
  const setPendingPlayRequest = useAppStore(
    (state) => state.setPendingPlayRequest,
  );
  const recordOutboundCommand = useAppStore(
    (state) => state.recordOutboundCommand,
  );
  const removeFavoriteEntry = useAppStore((state) => state.removeFavoriteEntry);
  const clearFavorites = useAppStore((state) => state.clearFavorites);

  const restoreFavoriteEntry = useCallback(
    (entry: FavoriteEntry): void => {
      if (!entry || !Array.isArray(entry.entries) || !entry.entries.length) {
        setStatus("error", "Playlist yêu thích không còn hợp lệ.");
        return;
      }

      const requestId = createRequestId("restore-playlist");
      setPendingPlayRequest(requestId);
      recordOutboundCommand(UI_COMMANDS.PLAY_ALL);
      setStatus("loading", "Đang mở playlist yêu thích...");
      iinaClient.post(UI_COMMANDS.PLAY_ALL, {
        requestId,
        sourceId: entry.sourceId || "",
        movieId: entry.movieId || "",
        detailSlug: entry.detailSlug || "",
        title: entry.title || "Movie",
        serverId: entry.serverId || "",
        startEpisodeIndex:
          typeof entry.episodeIndex === "number" ? entry.episodeIndex : 0,
        preservePlaylistOrder: true,
        entries: entry.entries,
      });
    },
    [recordOutboundCommand, setPendingPlayRequest, setStatus],
  );

  const removeFavorite = useCallback(
    (entryId: string): void => {
      removeFavoriteEntry(entryId);
    },
    [removeFavoriteEntry],
  );

  return {
    restoreFavoriteEntry,
    removeFavorite,
    clearFavorites,
  };
}
