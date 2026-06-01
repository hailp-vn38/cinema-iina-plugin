import { createRuntimeBus } from "./bridge/runtimeBus";
import { registerMessages } from "./bridge/registerMessages";
import { createDiagnosticService } from "./services/diagnosticService";
import { createPlaybackService } from "./services/playbackService";
import { createPlaybackStateService } from "./services/playbackStateService";
import { createSidebarSyncService } from "./services/sidebarSyncService";
import { createPlaybackStore } from "./state/playbackStore";
import { createRuntimeStore } from "./state/runtimeStore";
import {
  DEFAULT_PROVIDER_ENDPOINTS,
  PLAY_HANDOFF_MAX_AGE_MS,
  PLAY_HANDOFF_PATH,
} from "../shared/constants";
import type {
  PlayAllCommand,
  PlayEpisodeCommand,
} from "../shared/contracts/models";
import { runDeferred } from "./utils/deferred";
import { GLOBAL_MESSAGES } from "../global/messages";

const { console, core, event, file, global: globalApi, mpv, preferences, sidebar } = iina;

const SIDEBAR_HTML_PATH = "ui/index.html";
const runtimeStore = createRuntimeStore();
const playbackStore = createPlaybackStore();
const bus = createRuntimeBus(sidebar);
const playerLabel =
  globalApi && typeof globalApi.getLabel === "function" ? globalApi.getLabel() : "";
const globalMessagingAvailable = Boolean(
  globalApi &&
    typeof globalApi.postMessage === "function" &&
    typeof globalApi.onMessage === "function",
);
runtimeStore.diagnostic.runtimeMode = playerLabel ? "managed-player" : "sidebar-runtime";
runtimeStore.diagnostic.activePlayerLabel = playerLabel || "";
const diagnosticService = createDiagnosticService({
  runtimeStore,
  console,
});
const sidebarSyncService = createSidebarSyncService({
  bus,
  runtimeStore,
  playbackStore,
  diagnosticService,
});
const playbackStateService = createPlaybackStateService({
  core,
  event,
  mpv,
  playbackStore,
  sidebarSyncService,
  onPlaybackStateChanged(payload) {
    if (globalMessagingAvailable) {
      globalApi.postMessage(GLOBAL_MESSAGES.PLAYER_PLAYBACK_STATE, payload);
    }
  },
});
const playbackService = createPlaybackService({
  core,
  mpv,
  sidebar,
  playbackStore,
  runtimeStore,
  sidebarSyncService,
  playbackStateService,
  diagnosticService,
});

let sidebarLoaded = false;
let messagesRegistered = false;
let globalReadyPosted = false;
let managedByGlobal = false;
let revealAttemptTimer: ReturnType<typeof setTimeout> | null = null;
let pendingBootstrapEpisode: PlayEpisodeCommand | null = null;
let pendingBootstrapPlaylist: PlayAllCommand | null = null;
let bootstrapFinalizeTimer: ReturnType<typeof setTimeout> | null = null;

interface PendingPlayHandoff {
  kind: "episode" | "playlist";
  createdAt: number;
  initialUrl: string;
  payload: PlayEpisodeCommand | PlayAllCommand;
}

function syncPreferencesIntoStore(): void {
  runtimeStore.setConfig({
    ophimApiBase:
      String(preferences.get("ophimApiBase") || "").trim() ||
      DEFAULT_PROVIDER_ENDPOINTS.ophimApiBase,
    kkphimApiBase:
      String(preferences.get("kkphimApiBase") || "").trim() ||
      DEFAULT_PROVIDER_ENDPOINTS.kkphimApiBase,
  });
}

function loadSidebar(): void {
  if (sidebarLoaded) {
    return;
  }

  sidebarLoaded = true;
  runtimeStore.setSidebarLoaded(true);
  console.log("Loading new React sidebar scaffold");
  sidebar.loadFile(SIDEBAR_HTML_PATH);

  if (!managedByGlobal) {
    sidebar.show();
  }

  sidebarSyncService.syncDiagnostic();
}

function ensureMessagesRegistered(): void {
  if (messagesRegistered) {
    return;
  }

  messagesRegistered = true;
  registerMessages({
    bus,
    runtimeStore,
    sidebarSyncService,
    diagnosticService,
    playbackService,
    syncPreferences: syncPreferencesIntoStore,
  });
}

function postToGlobal(name: string, payload: unknown): void {
  if (!globalMessagingAvailable) {
    return;
  }

  globalApi.postMessage(name, payload);
}

function currentSidebarAvailability(): { canOpenSidebar: boolean } {
  return {
    canOpenSidebar: Boolean(core.window?.loaded && core.status?.url),
  };
}

function updateManagedPlayerWindowDiagnostic(): {
  visible: boolean;
  miniaturized: boolean;
  pip: boolean;
  frame: string;
  statusUrl: string;
  videoWidth: number;
  videoHeight: number;
  paused: boolean;
  idle: boolean;
} {
  const visible = Boolean(core.window?.visible);
  const miniaturized = Boolean(core.window?.miniaturized);
  const pip = Boolean(core.window?.pip);
  const frameRect = core.window?.frame;
  const frameWidth = Number(frameRect?.width ?? frameRect?.w ?? 0);
  const frameHeight = Number(frameRect?.height ?? frameRect?.h ?? 0);
  const frame = frameRect
    ? `${frameRect.x},${frameRect.y},${frameWidth}x${frameHeight}`
    : "";
  const statusUrl = core.status?.url ? String(core.status.url) : "";
  const videoWidth = Number(core.status?.videoWidth || 0);
  const videoHeight = Number(core.status?.videoHeight || 0);
  const paused = Boolean(core.status?.paused);
  const idle = Boolean(core.status?.idle);

  runtimeStore.diagnostic.playerWindowVisible = visible;
  runtimeStore.diagnostic.playerWindowMiniaturized = miniaturized;
  runtimeStore.diagnostic.playerWindowPip = pip;
  runtimeStore.diagnostic.playerWindowFrame = frame;
  runtimeStore.diagnostic.playerStatusUrl = statusUrl;
  runtimeStore.diagnostic.playerVideoWidth = videoWidth;
  runtimeStore.diagnostic.playerVideoHeight = videoHeight;
  runtimeStore.diagnostic.playerPaused = paused;
  runtimeStore.diagnostic.playerIdle = idle;

  return {
    visible,
    miniaturized,
    pip,
    frame,
    statusUrl,
    videoWidth,
    videoHeight,
    paused,
    idle,
  };
}

function finalizeBootstrapIfReady(attempt = 0): void {
  const snapshot = updateManagedPlayerWindowDiagnostic();
  const ready =
    Boolean(snapshot.statusUrl) &&
    !snapshot.idle;

  if (ready) {
    if (pendingBootstrapEpisode) {
      const payload = pendingBootstrapEpisode;
      pendingBootstrapEpisode = null;
      playbackService.bootstrapEpisode(payload);
      postToGlobal(GLOBAL_MESSAGES.PLAYER_PLAY_RESULT, {
        requestId: payload.requestId ? String(payload.requestId) : "",
        ok: true,
        mode: "single",
      });
    } else if (pendingBootstrapPlaylist) {
      const payload = pendingBootstrapPlaylist;
      pendingBootstrapPlaylist = null;
      playbackService.bootstrapPlaylist(payload);
      postToGlobal(GLOBAL_MESSAGES.PLAYER_PLAY_RESULT, {
        requestId: payload.requestId ? String(payload.requestId) : "",
        ok: true,
        mode: "playlist",
        count: Array.isArray(payload.entries) ? payload.entries.length : 0,
      });
    }
    sidebarSyncService.syncDiagnostic();
    return;
  }

  if (attempt >= 20) {
    runtimeStore.diagnostic.bridgePhase = "bootstrap-waiting-for-video";
    sidebarSyncService.syncDiagnostic();
    return;
  }

  if (bootstrapFinalizeTimer) {
    clearTimeout(bootstrapFinalizeTimer);
  }
  bootstrapFinalizeTimer = setTimeout(() => finalizeBootstrapIfReady(attempt + 1), 250);
}

function revealManagedPlayerWindow(attempt = 0): void {
  if (!managedByGlobal) {
    return;
  }

  const snapshotBefore = updateManagedPlayerWindowDiagnostic();

  if (
    snapshotBefore.visible &&
    !snapshotBefore.miniaturized &&
    !snapshotBefore.pip
  ) {
    runtimeStore.diagnostic.bridgePhase = "player-window-visible";
    sidebarSyncService.syncDiagnostic();
    return;
  }

  try {
    core.window.miniaturized = false;
  } catch {}

  try {
    core.window.pip = false;
  } catch {}

  const snapshot = updateManagedPlayerWindowDiagnostic();
  const readyToClose =
    snapshot.visible &&
    !snapshot.miniaturized &&
    !snapshot.pip &&
    Boolean(snapshot.statusUrl);

  if (readyToClose) {
    runtimeStore.diagnostic.bridgePhase = "player-window-visible";
    postToGlobal(GLOBAL_MESSAGES.PLAYER_WINDOW_VISIBLE, snapshot);
    sidebarSyncService.syncDiagnostic();
    return;
  }

  if (attempt >= 8) {
    runtimeStore.diagnostic.bridgePhase = "player-window-not-ready";
    sidebarSyncService.syncDiagnostic();
    return;
  }

  if (revealAttemptTimer) {
    clearTimeout(revealAttemptTimer);
  }

  revealAttemptTimer = setTimeout(() => {
    revealManagedPlayerWindow(attempt + 1);
  }, 250);
}

function notifyGlobalReady(): void {
  if (!globalMessagingAvailable || globalReadyPosted) {
    return;
  }

  globalReadyPosted = true;
  runtimeStore.diagnostic.bridgePhase = "player-ready-posted";
  runtimeStore.diagnostic.playerReady = true;
  postToGlobal(GLOBAL_MESSAGES.PLAYER_READY, {
    label: playerLabel,
    ...currentSidebarAvailability(),
  });
}

function postPlayerStatus(): void {
  postToGlobal(GLOBAL_MESSAGES.PLAYER_STATUS, {
    label: playerLabel,
    ...currentSidebarAvailability(),
  });
}

function readPendingPlayHandoff(): PendingPlayHandoff | null {
  try {
    if (!file.exists(PLAY_HANDOFF_PATH)) {
      return null;
    }
    const raw = file.read(PLAY_HANDOFF_PATH);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as PendingPlayHandoff;
    if (!parsed || !parsed.initialUrl || !parsed.createdAt || !parsed.payload) {
      return null;
    }
    if (Date.now() - Number(parsed.createdAt) > PLAY_HANDOFF_MAX_AGE_MS) {
      file.delete(PLAY_HANDOFF_PATH);
      return null;
    }
    return parsed;
  } catch (error) {
    diagnosticService.recordError("readPendingPlayHandoff failed", error);
    return null;
  }
}

function deletePendingPlayHandoff(): void {
  try {
    if (file.exists(PLAY_HANDOFF_PATH)) {
      file.delete(PLAY_HANDOFF_PATH);
    }
  } catch (error) {
    diagnosticService.recordError("deletePendingPlayHandoff failed", error);
  }
}

function tryApplyPendingPlayHandoff(): void {
  const handoff = readPendingPlayHandoff();
  if (!handoff) {
    return;
  }

  const currentUrl = core.status?.url ? String(core.status.url) : "";
  if (!currentUrl || currentUrl !== String(handoff.initialUrl)) {
    return;
  }

  managedByGlobal = false;
  runtimeStore.diagnostic.runtimeMode = "standard-player";
  runtimeStore.diagnostic.bridgePhase = "applying-play-handoff";

  try {
    if (handoff.kind === "episode") {
      playbackService.bootstrapEpisode(handoff.payload as PlayEpisodeCommand);
    } else {
      playbackService.bootstrapPlaylist(handoff.payload as PlayAllCommand);
    }
    deletePendingPlayHandoff();
    sidebarSyncService.syncAll();
  } catch (error) {
    diagnosticService.recordError("applyPendingPlayHandoff failed", error);
  }
}

function playFromGlobal(
  payload: PlayEpisodeCommand | PlayAllCommand,
  mode: "single" | "playlist",
): void {
  managedByGlobal = true;
  runtimeStore.diagnostic.runtimeMode = "managed-player";
  runtimeStore.diagnostic.bridgePhase =
    mode === "single" ? "received-global-play-episode" : "received-global-play-all";
  runtimeStore.diagnostic.pendingCommandName = "";
  runtimeStore.setState(
    "loading",
    mode === "single" ? "Runtime da nhan play_episode." : "Runtime da nhan play_all.",
  );
  sidebarSyncService.syncState();
  sidebarSyncService.syncDiagnostic();

  runDeferred(
    () => {
      if (mode === "single") {
        playbackService.playEpisode(payload as PlayEpisodeCommand);
      } else {
        playbackService.playAll(payload as PlayAllCommand);
      }

      postToGlobal(GLOBAL_MESSAGES.PLAYER_PLAY_RESULT, {
        requestId: payload.requestId ? String(payload.requestId) : "",
        ok: true,
        mode,
        count:
          mode === "playlist" && Array.isArray(payload.entries)
            ? payload.entries.length
            : undefined,
      });
    },
    (error) => {
      diagnosticService.recordError(
        mode === "single" ? "global play_episode failed" : "global play_all failed",
        error,
      );
      runtimeStore.setState(
        "error",
        mode === "single" ? "Khong phat duoc phim." : "Khong phat duoc playlist.",
      );
      sidebarSyncService.syncState();
      postToGlobal(GLOBAL_MESSAGES.PLAYER_PLAY_RESULT, {
        requestId: payload.requestId ? String(payload.requestId) : "",
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      sidebarSyncService.syncDiagnostic();
    },
  );
}

playbackStateService.register();

if (globalMessagingAvailable) {
  globalApi.onMessage(
    GLOBAL_MESSAGES.SHOW_SIDEBAR,
    () => {
      managedByGlobal = false;
      runtimeStore.diagnostic.runtimeMode = playerLabel ? "managed-player" : "sidebar-runtime";
      runtimeStore.diagnostic.bridgePhase = "show-sidebar-from-global";
      syncPreferencesIntoStore();
      loadSidebar();
      ensureMessagesRegistered();
      sidebar.show();
      sidebarSyncService.syncAll();
    },
  );
  globalApi.onMessage(
    GLOBAL_MESSAGES.PLAYER_BOOTSTRAP_EPISODE,
    (payload: PlayEpisodeCommand) => {
      managedByGlobal = true;
      runtimeStore.diagnostic.runtimeMode = "managed-player";
      runtimeStore.diagnostic.bridgePhase = "received-global-bootstrap-episode";
      pendingBootstrapEpisode = payload;
      pendingBootstrapPlaylist = null;
      runtimeStore.setState("loading", "Dang mo tap...");
      sidebarSyncService.syncState();
      finalizeBootstrapIfReady();
    },
  );
  globalApi.onMessage(
    GLOBAL_MESSAGES.PLAYER_BOOTSTRAP_PLAYLIST,
    (payload: PlayAllCommand) => {
      managedByGlobal = true;
      runtimeStore.diagnostic.runtimeMode = "managed-player";
      runtimeStore.diagnostic.bridgePhase = "received-global-bootstrap-playlist";
      pendingBootstrapPlaylist = payload;
      pendingBootstrapEpisode = null;
      runtimeStore.setState("loading", "Dang mo playlist...");
      sidebarSyncService.syncState();
      finalizeBootstrapIfReady();
    },
  );
  globalApi.onMessage(
    GLOBAL_MESSAGES.PLAYER_PLAY_EPISODE,
    (payload: PlayEpisodeCommand) => {
      playFromGlobal(payload, "single");
    },
  );
  globalApi.onMessage(
    GLOBAL_MESSAGES.PLAYER_PLAY_ALL,
    (payload: PlayAllCommand) => {
      playFromGlobal(payload, "playlist");
    },
  );

  event.on("iina.window-will-close", () => {
    if (revealAttemptTimer) {
      clearTimeout(revealAttemptTimer);
      revealAttemptTimer = null;
    }
    if (bootstrapFinalizeTimer) {
      clearTimeout(bootstrapFinalizeTimer);
      bootstrapFinalizeTimer = null;
    }
    postToGlobal(GLOBAL_MESSAGES.PLAYER_CLOSED, { label: playerLabel });
  });

  event.on("mpv.file-loaded", () => {
    tryApplyPendingPlayHandoff();
    postPlayerStatus();
    if (pendingBootstrapEpisode || pendingBootstrapPlaylist) {
      finalizeBootstrapIfReady();
    }
    revealManagedPlayerWindow();
  });

  event.on("iina.file-loaded", () => {
    tryApplyPendingPlayHandoff();
    postPlayerStatus();
    if (pendingBootstrapEpisode || pendingBootstrapPlaylist) {
      finalizeBootstrapIfReady();
    }
    revealManagedPlayerWindow();
  });

  event.on("iina.window-size-adjusted", () => {
    if (pendingBootstrapEpisode || pendingBootstrapPlaylist) {
      finalizeBootstrapIfReady();
    }
    revealManagedPlayerWindow();
  });

  notifyGlobalReady();

  event.on("iina.window-main.changed", (status: boolean) => {
    if (!status) {
      return;
    }
    postToGlobal(GLOBAL_MESSAGES.PLAYER_BECAME_MAIN, {
      label: playerLabel,
      ...currentSidebarAvailability(),
    });
  });
}

event.on("iina.window-loaded", () => {
  runtimeStore.setWindowLoaded(true);
  runtimeStore.diagnostic.bridgePhase = "window-loaded";
  syncPreferencesIntoStore();
  loadSidebar();
  ensureMessagesRegistered();
  runtimeStore.setState("ready", "Playback runtime ready.");
  sidebarSyncService.syncAll();
  postPlayerStatus();
  postToGlobal(GLOBAL_MESSAGES.PLAYER_WINDOW_LOADED, { label: playerLabel });
  notifyGlobalReady();
});
