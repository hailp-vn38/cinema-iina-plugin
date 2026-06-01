import type {
  PlaybackStateService,
  PlaybackStore,
  SidebarSyncService,
} from "../types";

export function createPlaybackStateService({
  core,
  event,
  mpv,
  playbackStore,
  sidebarSyncService,
}: {
  core: any;
  event: any;
  mpv: any;
  playbackStore: PlaybackStore;
  sidebarSyncService: SidebarSyncService;
}): PlaybackStateService {
  function syncFromRuntime(): void {
    if (!playbackStore.active) {
      sidebarSyncService.syncPlayback();
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
