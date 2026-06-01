import type { PlaybackContext, PlaybackStore } from "../types";

export function createPlaybackStore(): PlaybackStore {
  const store: PlaybackStore = {
    active: false,
    sourceId: "",
    movieId: "",
    detailSlug: "",
    title: "",
    episodeName: "",
    episodeIndex: -1,
    serverId: "",
    url: "",
    entries: [],
    playlistToOriginalIndexes: [],
    setContext(payload: PlaybackContext) {
      store.active = true;
      store.sourceId = payload.sourceId || "";
      store.movieId = payload.movieId || "";
      store.detailSlug = payload.detailSlug || "";
      store.title = payload.title || "";
      store.episodeName = payload.episodeName || "";
      store.episodeIndex =
        typeof payload.episodeIndex === "number" ? payload.episodeIndex : -1;
      store.serverId = payload.serverId || "";
      store.url = payload.url || "";
      store.entries = Array.isArray(payload.entries) ? payload.entries.slice() : [];
      store.playlistToOriginalIndexes = Array.isArray(
        payload.playlistToOriginalIndexes,
      )
        ? payload.playlistToOriginalIndexes.slice()
        : [];
    },
    setPlaybackPosition(playlistIndex: number, url: string) {
      const originalIndex =
        typeof store.playlistToOriginalIndexes[playlistIndex] === "number"
          ? store.playlistToOriginalIndexes[playlistIndex]
          : playlistIndex;
      const entry = store.entries[originalIndex] || null;
      store.episodeIndex =
        typeof originalIndex === "number" ? originalIndex : -1;
      store.episodeName = entry?.name ? entry.name : "";
      store.url = url || (entry?.url ? entry.url : "");
    },
    clear() {
      store.active = false;
      store.sourceId = "";
      store.movieId = "";
      store.detailSlug = "";
      store.title = "";
      store.episodeName = "";
      store.episodeIndex = -1;
      store.serverId = "";
      store.url = "";
      store.entries = [];
      store.playlistToOriginalIndexes = [];
    },
  };

  return store;
}
