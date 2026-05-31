import { RUNTIME_EVENTS } from "../../shared/contracts/events.js";

export function createSidebarSyncService({ bus, runtimeStore, playbackStore, diagnosticService }) {
  function emit(name, payload) {
    bus.emit(name, payload);
    diagnosticService.recordAppMessage(name);
  }

  return {
    syncState() {
      emit(RUNTIME_EVENTS.APP_STATE, runtimeStore.state);
    },
    syncDiagnostic() {
      emit(RUNTIME_EVENTS.APP_DIAGNOSTIC, diagnosticService.snapshot());
    },
    syncPlayback() {
      emit(RUNTIME_EVENTS.APP_PLAYBACK_STATE, {
        active: playbackStore.active,
        sourceId: playbackStore.sourceId,
        movieId: playbackStore.movieId,
        detailSlug: playbackStore.detailSlug,
        title: playbackStore.title,
        episodeName: playbackStore.episodeName,
        episodeIndex: playbackStore.episodeIndex,
        serverId: playbackStore.serverId,
        url: playbackStore.url,
      });
    },
    postPlayResult(payload) {
      emit(RUNTIME_EVENTS.APP_PLAY_RESULT, payload);
    },
    syncAll() {
      this.syncState();
      this.syncPlayback();
      this.syncDiagnostic();
    },
  };
}
