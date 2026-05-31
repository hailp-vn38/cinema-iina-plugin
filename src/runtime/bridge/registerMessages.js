import { UI_COMMANDS } from "../../shared/contracts/commands.js";
import { runDeferred } from "../utils/deferred.js";

export function registerMessages({
  bus,
  runtimeStore,
  sidebarSyncService,
  diagnosticService,
  playbackService,
}) {
  bus.on(UI_COMMANDS.INIT, () => {
    runtimeStore.setUiInitialized(true);
    diagnosticService.recordUiMessage(UI_COMMANDS.INIT);
    runtimeStore.setState("connected", "Sidebar connected.");
    sidebarSyncService.syncAll();
  });

  bus.on(UI_COMMANDS.REQUEST_DIAGNOSTIC, () => {
    diagnosticService.recordUiMessage(UI_COMMANDS.REQUEST_DIAGNOSTIC);
    sidebarSyncService.syncDiagnostic();
  });

  bus.on(UI_COMMANDS.PLAY_EPISODE, (payload) => {
    diagnosticService.recordUiMessage(UI_COMMANDS.PLAY_EPISODE);
    runDeferred(
      () => {
        playbackService.playEpisode(payload || {});
        sidebarSyncService.postPlayResult({
          requestId: payload && payload.requestId ? String(payload.requestId) : "",
          ok: true,
          mode: "single",
        });
      },
      (error) => {
        diagnosticService.recordError("play_episode failed", error);
        runtimeStore.setState("error", "Khong phat duoc phim.");
        sidebarSyncService.syncState();
        sidebarSyncService.postPlayResult({
          requestId: payload && payload.requestId ? String(payload.requestId) : "",
          ok: false,
          error: error && error.message ? error.message : "Unknown error",
        });
        sidebarSyncService.syncDiagnostic();
      }
    );
  });

  bus.on(UI_COMMANDS.PLAY_ALL, (payload) => {
    diagnosticService.recordUiMessage(UI_COMMANDS.PLAY_ALL);
    runDeferred(
      () => {
        playbackService.playAll(payload || {});
        sidebarSyncService.postPlayResult({
          requestId: payload && payload.requestId ? String(payload.requestId) : "",
          ok: true,
          mode: "playlist",
          count: Array.isArray(payload && payload.entries) ? payload.entries.length : 0,
        });
      },
      (error) => {
        diagnosticService.recordError("play_all failed", error);
        runtimeStore.setState("error", "Khong phat duoc playlist.");
        sidebarSyncService.syncState();
        sidebarSyncService.postPlayResult({
          requestId: payload && payload.requestId ? String(payload.requestId) : "",
          ok: false,
          error: error && error.message ? error.message : "Unknown error",
        });
        sidebarSyncService.syncDiagnostic();
      }
    );
  });
}
