import type {
  PlayAllCommand,
  PlayEpisodeCommand,
} from "../../shared/contracts/models";
import type {
  DiagnosticService,
  PlaybackEntry,
  PlaybackService,
  PlaybackStateService,
  PlaybackStore,
  RuntimeStore,
  SidebarSyncService,
} from "../types";

function normalizeEntries(
  payload: PlayEpisodeCommand | PlayAllCommand,
): PlaybackEntry[] {
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

export function createPlaybackService({
  core,
  mpv,
  sidebar,
  playbackStore,
  runtimeStore,
  sidebarSyncService,
  playbackStateService,
  diagnosticService,
}: {
  core: any;
  mpv: any;
  sidebar: { hide: () => void };
  playbackStore: PlaybackStore;
  runtimeStore: RuntimeStore;
  sidebarSyncService: SidebarSyncService;
  playbackStateService: PlaybackStateService;
  diagnosticService: DiagnosticService;
}): PlaybackService {
  function ensurePlayerWindowVisible(): void {
    try {
      const windowApi = core?.window;
      if (!windowApi) {
        return;
      }

      try {
        windowApi.miniaturized = false;
      } catch {}

      try {
        windowApi.pip = false;
      } catch {}
    } catch (error) {
      diagnosticService.recordError("ensurePlayerWindowVisible failed", error);
      return;
    }
  }

  function setMediaTitle(title: string, episodeName: string): void {
    const parts = [title, episodeName].filter(Boolean);
    if (!parts.length) {
      return;
    }

    mpv.set("force-media-title", parts.join(" - "));
  }

  function loadEntries({
    payload,
    entries,
    startIndex,
    appendRest,
    preservePlaylistOrder = false,
  }: {
    payload: PlayEpisodeCommand | PlayAllCommand;
    entries: PlaybackEntry[];
    startIndex: number;
    appendRest: boolean;
    preservePlaylistOrder?: boolean;
  }): void {
    const safeStartIndex =
      typeof startIndex === "number" &&
      startIndex >= 0 &&
      startIndex < entries.length
        ? startIndex
        : 0;
    const firstEntry = preservePlaylistOrder ? entries[0] : entries[safeStartIndex];
    const mapping = preservePlaylistOrder ? [0] : [safeStartIndex];

    setMediaTitle(payload.title || "", firstEntry.name || "");
    mpv.command("loadfile", [firstEntry.url, "replace"]);

    if (appendRest) {
      for (let index = 0; index < entries.length; index += 1) {
        if (index === (preservePlaylistOrder ? 0 : safeStartIndex)) {
          continue;
        }
        mpv.command("loadfile", [entries[index].url, "append"]);
        mapping.push(index);
      }

      if (preservePlaylistOrder && safeStartIndex > 0) {
        mpv.command("playlist-play-index", [String(safeStartIndex)]);
        setMediaTitle(payload.title || "", entries[safeStartIndex].name || "");
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
    bootstrapEpisode(payload: PlayEpisodeCommand) {
      const entries = normalizeEntries(payload);
      const episodeIndex =
        typeof payload.episodeIndex === "number" ? payload.episodeIndex : 0;
      const currentEntry = entries[episodeIndex] || entries[0];

      setMediaTitle(payload.title || "", currentEntry.name || "");
      playbackStore.setContext({
        sourceId: payload.sourceId || "",
        movieId: payload.movieId || "",
        detailSlug: payload.detailSlug || "",
        title: payload.title || "",
        episodeName: currentEntry.name || "",
        episodeIndex,
        serverId: payload.serverId || "",
        url: currentEntry.url,
        entries,
        playlistToOriginalIndexes: [episodeIndex],
      });

      playbackStateService.syncNow();
      runtimeStore.setState(
        "ready",
        "Dang phat: " + (payload.episodeName || currentEntry.name || "episode"),
      );
      ensurePlayerWindowVisible();
      sidebarSyncService.syncAll();
      sidebar.hide();
    },
    bootstrapPlaylist(payload: PlayAllCommand) {
      const entries = normalizeEntries(payload);
      const startEpisodeIndex =
        typeof payload.startEpisodeIndex === "number"
          ? payload.startEpisodeIndex
          : 0;
      const safeStartIndex =
        startEpisodeIndex >= 0 && startEpisodeIndex < entries.length
          ? startEpisodeIndex
          : 0;
      const currentEntry = entries[safeStartIndex] || entries[0];
      const mapping = [safeStartIndex];

      setMediaTitle(payload.title || "", currentEntry.name || "");

      for (let index = 0; index < entries.length; index += 1) {
        if (index === safeStartIndex) {
          continue;
        }
        mpv.command("loadfile", [entries[index].url, "append"]);
        mapping.push(index);
      }

      playbackStore.setContext({
        sourceId: payload.sourceId || "",
        movieId: payload.movieId || "",
        detailSlug: payload.detailSlug || "",
        title: payload.title || "",
        episodeName: currentEntry.name || "",
        episodeIndex: safeStartIndex,
        serverId: payload.serverId || "",
        url: currentEntry.url,
        entries,
        playlistToOriginalIndexes: mapping,
      });

      playbackStateService.syncNow();
      runtimeStore.setState(
        "ready",
        "Dang phat va da them " + entries.length + " tap.",
      );
      ensurePlayerWindowVisible();
      sidebarSyncService.syncAll();
      sidebar.hide();
    },
    playEpisode(payload: PlayEpisodeCommand) {
      const entries = normalizeEntries(payload);
      const episodeIndex =
        typeof payload.episodeIndex === "number" ? payload.episodeIndex : 0;
      const currentEntry = entries[episodeIndex] || entries[0];

      runtimeStore.setState("loading", "Dang mo tap...");
      sidebarSyncService.syncState();
      diagnosticService.recordPlayStage("before-loadfile-single", {
        requestId: payload.requestId,
        mode: "single",
        title: payload.title,
        url: currentEntry?.url || "",
      });
      runtimeStore.setState("loading", "Runtime dang goi loadfile single.");
      sidebarSyncService.syncState();
      sidebarSyncService.syncDiagnostic();
      loadEntries({
        payload,
        entries,
        startIndex: episodeIndex,
        appendRest: false,
        preservePlaylistOrder: false,
      });
      diagnosticService.recordPlayStage("after-loadfile-single", {
        requestId: payload.requestId,
        mode: "single",
        title: payload.title,
        url: currentEntry?.url || "",
      });
      runtimeStore.setState("loading", "Runtime da goi xong loadfile single.");
      sidebarSyncService.syncState();
      runtimeStore.setState(
        "ready",
        "Dang phat: " + (payload.episodeName || "episode"),
      );
      ensurePlayerWindowVisible();
      sidebarSyncService.syncAll();
      sidebar.hide();
    },
    playAll(payload: PlayAllCommand) {
      const entries = normalizeEntries(payload);
      const startEpisodeIndex =
        typeof payload.startEpisodeIndex === "number"
          ? payload.startEpisodeIndex
          : 0;
      const currentEntry = entries[startEpisodeIndex] || entries[0];

      runtimeStore.setState("loading", "Dang them playlist...");
      sidebarSyncService.syncState();
      diagnosticService.recordPlayStage("before-loadfile-playlist", {
        requestId: payload.requestId,
        mode: "playlist",
        title: payload.title,
        url: currentEntry?.url || "",
      });
      runtimeStore.setState("loading", "Runtime dang goi loadfile playlist.");
      sidebarSyncService.syncState();
      sidebarSyncService.syncDiagnostic();
      loadEntries({
        payload,
        entries,
        startIndex: startEpisodeIndex,
        appendRest: true,
        preservePlaylistOrder: Boolean(payload.preservePlaylistOrder),
      });
      diagnosticService.recordPlayStage("after-loadfile-playlist", {
        requestId: payload.requestId,
        mode: "playlist",
        title: payload.title,
        url: currentEntry?.url || "",
      });
      runtimeStore.setState("loading", "Runtime da goi xong loadfile playlist.");
      sidebarSyncService.syncState();
      runtimeStore.setState(
        "ready",
        "Dang phat va da them " + entries.length + " tap.",
      );
      ensurePlayerWindowVisible();
      sidebarSyncService.syncAll();
      sidebar.hide();
    },
  };
}
