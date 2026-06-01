import { RUNTIME_EVENTS } from "../../shared/contracts/events";
import type {
  AppConfigPayload,
  AppPlayResultPayload,
  AppPlaybackStatePayload,
} from "../../shared/contracts/models";
import type {
  DiagnosticService,
  PlaybackStore,
  RuntimeBus,
  RuntimeStore,
  SidebarSyncService,
} from "../types";

export function createSidebarSyncService({
  bus,
  runtimeStore,
  playbackStore,
  diagnosticService,
}: {
  bus: RuntimeBus;
  runtimeStore: RuntimeStore;
  playbackStore: PlaybackStore;
  diagnosticService: DiagnosticService;
}): SidebarSyncService {
  function emit(name: string, payload: unknown): void {
    diagnosticService.recordAppMessage(name);
    if (!runtimeStore.sidebarLoaded) {
      return;
    }

    const nextPayload =
      name === RUNTIME_EVENTS.APP_DIAGNOSTIC
        ? diagnosticService.snapshot()
        : payload;
    bus.emit(name, nextPayload);
  }

  return {
    syncState() {
      emit(RUNTIME_EVENTS.APP_STATE, runtimeStore.state);
    },
    syncDiagnostic() {
      emit(RUNTIME_EVENTS.APP_DIAGNOSTIC, diagnosticService.snapshot());
    },
    syncConfig() {
      const payload: AppConfigPayload = {
        ophimApiBase: runtimeStore.config.ophimApiBase,
        kkphimApiBase: runtimeStore.config.kkphimApiBase,
      };
      emit(RUNTIME_EVENTS.APP_CONFIG, payload);
    },
    syncPlayback() {
      const payload: AppPlaybackStatePayload = {
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
      emit(RUNTIME_EVENTS.APP_PLAYBACK_STATE, payload);
    },
    postPlayResult(payload: AppPlayResultPayload) {
      emit(RUNTIME_EVENTS.APP_PLAY_RESULT, payload);
    },
    syncAll() {
      this.syncState();
      this.syncConfig();
      this.syncPlayback();
      this.syncDiagnostic();
    },
  };
}
