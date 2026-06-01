import { useCallback } from "react";
import { UI_COMMANDS } from "@shared/contracts/commands";
import { iinaClient } from "../bridge/iinaClient";
import { useAppStore } from "../store/appStore";
import type { HistoryEntry } from "../store/types";

function createRequestId(prefix: string): string {
  return (
    prefix +
    "-" +
    Date.now() +
    "-" +
    Math.random().toString(36).slice(2, 8)
  );
}

export interface HistoryActions {
  restoreHistoryEntry: (entry: HistoryEntry) => void;
  removeHistory: (entryId: string) => void;
  clearHistory: () => void;
}

export function useHistoryActions(): HistoryActions {
  const setStatus = useAppStore((state) => state.setStatus);
  const setPendingPlayRequest = useAppStore(
    (state) => state.setPendingPlayRequest,
  );
  const recordOutboundCommand = useAppStore(
    (state) => state.recordOutboundCommand,
  );
  const removeHistoryEntry = useAppStore((state) => state.removeHistoryEntry);
  const clearHistory = useAppStore((state) => state.clearHistory);

  const restoreHistoryEntry = useCallback(
    (entry: HistoryEntry): void => {
      if (!entry || !Array.isArray(entry.entries) || !entry.entries.length) {
        setStatus("error", "Playlist lịch sử không còn hợp lệ.");
        return;
      }

      const requestId = createRequestId("restore-playlist");
      setPendingPlayRequest(requestId);
      recordOutboundCommand(UI_COMMANDS.PLAY_ALL);
      setStatus("loading", "Đang khôi phục playlist...");
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

  const removeHistory = useCallback(
    (entryId: string): void => {
      removeHistoryEntry(entryId);
    },
    [removeHistoryEntry],
  );

  return {
    restoreHistoryEntry,
    removeHistory,
    clearHistory,
  };
}
