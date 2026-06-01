import { UI_COMMANDS } from "../../shared/contracts/commands";
import type {
  PlayAllCommand,
  PlayEpisodeCommand,
} from "../../shared/contracts/models";
import { runDeferred } from "../utils/deferred";
import type {
  DiagnosticService,
  PlaybackService,
  RuntimeBus,
  RuntimeStore,
  SidebarSyncService,
} from "../types";

export function registerMessages({
  bus,
  runtimeStore,
  sidebarSyncService,
  diagnosticService,
  playbackService,
  syncPreferences,
}: {
  bus: RuntimeBus;
  runtimeStore: RuntimeStore;
  sidebarSyncService: SidebarSyncService;
  diagnosticService: DiagnosticService;
  playbackService: PlaybackService;
  syncPreferences: () => void;
}): void {
  bus.on(UI_COMMANDS.INIT, () => {
    runtimeStore.setUiInitialized(true);
    diagnosticService.recordUiMessage(UI_COMMANDS.INIT);
    runtimeStore.setState("connected", "Sidebar connected.");
    sidebarSyncService.syncAll();
  });

  bus.on(UI_COMMANDS.REQUEST_DIAGNOSTIC, () => {
    syncPreferences();
    diagnosticService.recordUiMessage(UI_COMMANDS.REQUEST_DIAGNOSTIC);
    sidebarSyncService.syncConfig();
    sidebarSyncService.syncDiagnostic();
  });

  bus.on(UI_COMMANDS.REQUEST_RUNTIME_SYNC, () => {
    syncPreferences();
    diagnosticService.recordUiMessage(UI_COMMANDS.REQUEST_RUNTIME_SYNC);
    sidebarSyncService.syncAll();
  });

  bus.on(UI_COMMANDS.PLAY_EPISODE, (payload: PlayEpisodeCommand) => {
    diagnosticService.recordUiMessage(UI_COMMANDS.PLAY_EPISODE);
    diagnosticService.recordPlayStage("received-play-episode", {
      requestId: payload?.requestId ? payload.requestId : "",
      mode: "single",
      title: payload?.title ? payload.title : "",
      url:
        Array.isArray(payload?.entries) &&
        payload.entries[
          typeof payload.episodeIndex === "number" ? payload.episodeIndex : 0
        ]
          ? payload.entries[
              typeof payload.episodeIndex === "number" ? payload.episodeIndex : 0
            ].url
          : "",
    });
    runtimeStore.setState("loading", "Runtime da nhan play_episode.");
    sidebarSyncService.syncState();
    sidebarSyncService.syncDiagnostic();
    runDeferred(
      () => {
        playbackService.playEpisode(payload);
        diagnosticService.recordPlayStage("play-episode-success", {
          requestId: payload?.requestId ? payload.requestId : "",
          mode: "single",
          title: payload?.title ? payload.title : "",
        });
        sidebarSyncService.postPlayResult({
          requestId: payload?.requestId ? String(payload.requestId) : "",
          ok: true,
          mode: "single",
        });
      },
      (error) => {
        diagnosticService.recordPlayStage("play-episode-error", {
          requestId: payload?.requestId ? payload.requestId : "",
          mode: "single",
          title: payload?.title ? payload.title : "",
        });
        diagnosticService.recordError("play_episode failed", error);
        runtimeStore.setState("error", "Khong phat duoc phim.");
        sidebarSyncService.syncState();
        sidebarSyncService.postPlayResult({
          requestId: payload?.requestId ? String(payload.requestId) : "",
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        sidebarSyncService.syncDiagnostic();
      },
    );
  });

  bus.on(UI_COMMANDS.PLAY_ALL, (payload: PlayAllCommand) => {
    diagnosticService.recordUiMessage(UI_COMMANDS.PLAY_ALL);
    diagnosticService.recordPlayStage("received-play-all", {
      requestId: payload?.requestId ? payload.requestId : "",
      mode: "playlist",
      title: payload?.title ? payload.title : "",
      url:
        Array.isArray(payload?.entries) &&
        payload.entries[
          typeof payload.startEpisodeIndex === "number"
            ? payload.startEpisodeIndex
            : 0
        ]
          ? payload.entries[
              typeof payload.startEpisodeIndex === "number"
                ? payload.startEpisodeIndex
                : 0
            ].url
          : "",
    });
    runtimeStore.setState("loading", "Runtime da nhan play_all.");
    sidebarSyncService.syncState();
    sidebarSyncService.syncDiagnostic();
    runDeferred(
      () => {
        playbackService.playAll(payload);
        diagnosticService.recordPlayStage("play-all-success", {
          requestId: payload?.requestId ? payload.requestId : "",
          mode: "playlist",
          title: payload?.title ? payload.title : "",
        });
        sidebarSyncService.postPlayResult({
          requestId: payload?.requestId ? String(payload.requestId) : "",
          ok: true,
          mode: "playlist",
          count: Array.isArray(payload?.entries) ? payload.entries.length : 0,
        });
      },
      (error) => {
        diagnosticService.recordPlayStage("play-all-error", {
          requestId: payload?.requestId ? payload.requestId : "",
          mode: "playlist",
          title: payload?.title ? payload.title : "",
        });
        diagnosticService.recordError("play_all failed", error);
        runtimeStore.setState("error", "Khong phat duoc playlist.");
        sidebarSyncService.syncState();
        sidebarSyncService.postPlayResult({
          requestId: payload?.requestId ? String(payload.requestId) : "",
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        sidebarSyncService.syncDiagnostic();
      },
    );
  });
}
