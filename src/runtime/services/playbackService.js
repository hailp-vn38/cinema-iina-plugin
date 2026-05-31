export function createPlaybackService({
  core,
  mpv,
  playbackStore,
  runtimeStore,
  sidebarSyncService,
  playbackStateService,
}) {
  function validateEntries(payload) {
    const entries = Array.isArray(payload.entries) ? payload.entries : [];
    const validEntries = entries.filter((entry) => entry && entry.url);

    if (!validEntries.length) {
      throw new Error("Khong co link phat hop le.");
    }

    return validEntries.map((entry) => ({
      name: entry.name ? String(entry.name) : "",
      url: String(entry.url),
    }));
  }

  function setMediaTitle(title, episodeName) {
    const parts = [title, episodeName].filter(Boolean);
    if (!parts.length) {
      return;
    }

    mpv.set("force-media-title", parts.join(" - "));
  }

  function loadEntries({ payload, entries, startIndex, appendRest }) {
    const safeStartIndex =
      typeof startIndex === "number" && startIndex >= 0 && startIndex < entries.length
        ? startIndex
        : 0;
    const firstEntry = entries[safeStartIndex];
    const mapping = [safeStartIndex];

    setMediaTitle(payload.title || "", firstEntry.name || "");
    mpv.command("loadfile", [firstEntry.url, "replace"]);

    if (appendRest) {
      for (let index = 0; index < entries.length; index += 1) {
        if (index === safeStartIndex) {
          continue;
        }
        mpv.command("loadfile", [entries[index].url, "append"]);
        mapping.push(index);
      }
    }

    playbackStore.setContext({
      sourceId: payload.sourceId || "",
      movieId: payload.movieId || "",
      detailSlug: payload.detailSlug || "",
      title: payload.title || "",
      episodeName: firstEntry.name || "",
      episodeIndex: safeStartIndex,
      serverId: payload.serverId || "",
      url: firstEntry.url,
      entries,
      playlistToOriginalIndexes: mapping,
    });

    playbackStateService.syncNow();
  }

  return {
    playEpisode(payload) {
      const entries = validateEntries(payload);
      const episodeIndex =
        typeof payload.episodeIndex === "number" ? payload.episodeIndex : 0;

      runtimeStore.setState("loading", "Dang mo tap...");
      sidebarSyncService.syncState();
      loadEntries({
        payload,
        entries,
        startIndex: episodeIndex,
        appendRest: false,
      });
      runtimeStore.setState("ready", "Dang phat: " + (payload.episodeName || "episode"));
      sidebarSyncService.syncAll();
    },
    playAll(payload) {
      const entries = validateEntries(payload);
      const startEpisodeIndex =
        typeof payload.startEpisodeIndex === "number" ? payload.startEpisodeIndex : 0;

      runtimeStore.setState("loading", "Dang them playlist...");
      sidebarSyncService.syncState();
      loadEntries({
        payload,
        entries,
        startIndex: startEpisodeIndex,
        appendRest: true,
      });
      runtimeStore.setState("ready", "Dang phat va da them " + entries.length + " tap.");
      sidebarSyncService.syncAll();
    },
  };
}
