import type {
  PlaybackStateService,
  PlaybackStore,
  RuntimePlaybackSnapshot,
  SidebarSyncService,
} from "../types";

export function createPlaybackStateService({
  core,
  event,
  mpv,
  playbackStore,
  sidebarSyncService,
  onPlaybackStateChanged,
}: {
  core: any;
  event: any;
  mpv: any;
  playbackStore: PlaybackStore;
  sidebarSyncService: SidebarSyncService;
  onPlaybackStateChanged?: (payload: RuntimePlaybackSnapshot) => void;
}): PlaybackStateService {
  function snapshot(): RuntimePlaybackSnapshot {
    return {
      active: playbackStore.active,
      sourceId: playbackStore.sourceId,
      movieId: playbackStore.movieId,
      detailSlug: playbackStore.detailSlug,
      title: playbackStore.title,
      episodeName: playbackStore.episodeName,
      episodeIndex: playbackStore.episodeIndex,
      serverId: playbackStore.serverId,
      url: playbackStore.url,
    };
  }

  function syncFromRuntime(): void {
    if (!playbackStore.active) {
      sidebarSyncService.syncPlayback();
      onPlaybackStateChanged?.(snapshot());
      return;
    }

    let playlistIndex = mpv.getNumber("playlist-pos");
    if (
      typeof playlistIndex !== "number" ||
      Number.isNaN(playlistIndex) ||
      playlistIndex < 0
    ) {
      playlistIndex = 0;
    }

    playbackStore.setPlaybackPosition(playlistIndex, core.status.url || "");
    sidebarSyncService.syncPlayback();
    onPlaybackStateChanged?.(snapshot());
  }

  return {
    register() {
      event.on("mpv.file-loaded", syncFromRuntime);
      event.on("mpv.playlist-pos.changed", syncFromRuntime);
    },
    syncNow() {
      syncFromRuntime();
    },
  };
}
