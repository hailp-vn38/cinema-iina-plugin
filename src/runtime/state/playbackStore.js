export function createPlaybackStore() {
  return {
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
    setContext(payload) {
      this.active = true;
      this.sourceId = payload.sourceId || "";
      this.movieId = payload.movieId || "";
      this.detailSlug = payload.detailSlug || "";
      this.title = payload.title || "";
      this.episodeName = payload.episodeName || "";
      this.episodeIndex = typeof payload.episodeIndex === "number" ? payload.episodeIndex : -1;
      this.serverId = payload.serverId || "";
      this.url = payload.url || "";
      this.entries = Array.isArray(payload.entries) ? payload.entries.slice() : [];
      this.playlistToOriginalIndexes = Array.isArray(payload.playlistToOriginalIndexes)
        ? payload.playlistToOriginalIndexes.slice()
        : [];
    },
    setPlaybackPosition(playlistIndex, url) {
      const originalIndex =
        typeof this.playlistToOriginalIndexes[playlistIndex] === "number"
          ? this.playlistToOriginalIndexes[playlistIndex]
          : playlistIndex;
      const entry = this.entries[originalIndex] || null;
      this.episodeIndex = typeof originalIndex === "number" ? originalIndex : -1;
      this.episodeName = entry && entry.name ? entry.name : "";
      this.url = url || (entry && entry.url ? entry.url : "");
    },
    clear() {
      this.active = false;
      this.sourceId = "";
      this.movieId = "";
      this.detailSlug = "";
      this.title = "";
      this.episodeName = "";
      this.episodeIndex = -1;
      this.serverId = "";
      this.url = "";
      this.entries = [];
      this.playlistToOriginalIndexes = [];
    },
  };
}
