import { UI_COMMANDS } from "../shared/contracts/commands";
import { RUNTIME_EVENTS } from "../shared/contracts/events";
import type {
  AppConfigPayload,
  AppDiagnosticPayload,
  AppPlayResultPayload,
  AppPlaybackStatePayload,
  AppStatePayload,
  PlayAllCommand,
  PlayEpisodeCommand,
} from "../shared/contracts/models";
import {
  DEFAULT_PROVIDER_ENDPOINTS,
  PLAY_HANDOFF_PATH,
  PLUGIN_METADATA,
} from "../shared/constants";
import { GLOBAL_MESSAGES } from "./messages";

const { console, file, global, menu, preferences, standaloneWindow, utils } = iina;

const PLAYER_LABEL = "cinema-sources-managed-player";
const UI_HTML_PATH = "ui/index.html";

let windowLoaded = false;
let windowMessagingRegistered = false;
let activePlayerId: number | null = null;
let activePlayerLabel = "";
let playerReady = false;
let playerWindowLoaded = false;
let pendingCommand: PlayEpisodeCommand | PlayAllCommand | null = null;
let bootstrapEpisodePending = false;
let bootstrapPlaylistPending = false;
let readyDispatchTimer: ReturnType<typeof setTimeout> | null = null;

const state: AppStatePayload = {
  status: "booting",
  message: "Khoi tao global browser...",
};

const diagnostic: AppDiagnosticPayload = {
  pluginVersion: PLUGIN_METADATA.version,
  sidebarLoaded: false,
  windowLoaded: true,
  lastUiMessage: "",
  lastAppMessage: "",
  lastError: "",
  playStage: "",
  lastPlayRequestId: "",
  lastPlayMode: "",
  lastPlayTitle: "",
  lastPlayEntryUrl: "",
  runtimeMode: "global-window",
  bridgePhase: "booting",
  activePlayerLabel: "",
  playerReady: false,
  pendingCommandName: "",
};

let config: AppConfigPayload = {
  ...DEFAULT_PROVIDER_ENDPOINTS,
};

interface PendingPlayHandoff {
  kind: "episode" | "playlist";
  createdAt: number;
  initialUrl: string;
  payload: PlayEpisodeCommand | PlayAllCommand;
}

function setState(status: string, message: string): void {
  state.status = status;
  state.message = message;
}

function syncPreferencesIntoState(): void {
  config = {
    ophimApiBase:
      String(preferences.get("ophimApiBase") || "").trim() ||
      DEFAULT_PROVIDER_ENDPOINTS.ophimApiBase,
    kkphimApiBase:
      String(preferences.get("kkphimApiBase") || "").trim() ||
      DEFAULT_PROVIDER_ENDPOINTS.kkphimApiBase,
  };
}

function writePendingPlayHandoff(handoff: PendingPlayHandoff): void {
  file.write(PLAY_HANDOFF_PATH, JSON.stringify(handoff));
}

function openUrlInStandardIina(url: string): Promise<void> {
  return utils
    .exec("/usr/bin/open", ["-a", "IINA", url])
    .then((result: { status: number; stderr: string }) => {
      if (result.status !== 0) {
        throw new Error(result.stderr || "open command failed");
      }
    });
}

function handoffToStandardPlayer(
  payload: PlayEpisodeCommand | PlayAllCommand,
  kind: "episode" | "playlist",
): void {
  const entryIndex =
    kind === "episode"
      ? (payload as PlayEpisodeCommand).episodeIndex
      : (payload as PlayAllCommand).startEpisodeIndex;
  const initialUrl =
    Array.isArray(payload.entries) && payload.entries[entryIndex]
      ? String(payload.entries[entryIndex].url || "")
      : payload.entries?.[0]?.url
        ? String(payload.entries[0].url)
        : "";

  if (!initialUrl) {
    setState("error", "Khong co link phat hop le.");
    syncAll();
    return;
  }

  try {
    writePendingPlayHandoff({
      kind,
      createdAt: Date.now(),
      initialUrl,
      payload,
    });
  } catch (error) {
    diagnostic.lastError =
      error instanceof Error ? error.message : "Khong ghi duoc handoff file.";
    setState("error", "Khong mo duoc IINA player.");
    syncAll();
    return;
  }

  diagnostic.bridgePhase = "handoff-open-standard-player";
  diagnostic.pendingCommandName =
    kind === "episode" ? UI_COMMANDS.PLAY_EPISODE : UI_COMMANDS.PLAY_ALL;
  setState("loading", "Dang mo trong IINA...");
  syncAll();

  void openUrlInStandardIina(initialUrl)
    .then(() => {
      diagnostic.bridgePhase = "handoff-open-command-sent";
      syncAll();
      standaloneWindow.close();
    })
    .catch((error: unknown) => {
      diagnostic.lastError =
        error instanceof Error ? error.message : "Khong mo duoc IINA.";
      setState("error", "Khong mo duoc IINA player.");
      syncAll();
    });
}

function postToWindow(name: string, payload: unknown): void {
  diagnostic.lastAppMessage = name;
  standaloneWindow.postMessage(name, payload);
}

function syncAll(): void {
  postToWindow(RUNTIME_EVENTS.APP_STATE, { ...state });
  postToWindow(RUNTIME_EVENTS.APP_CONFIG, { ...config });
  postToWindow(RUNTIME_EVENTS.APP_DIAGNOSTIC, { ...diagnostic });
}

function ensureWindowMessaging(): void {
  if (windowMessagingRegistered) {
    return;
  }

  windowMessagingRegistered = true;
  diagnostic.bridgePhase = "window-messaging-registered";

  standaloneWindow.onMessage(UI_COMMANDS.INIT, () => {
    diagnostic.lastUiMessage = UI_COMMANDS.INIT;
    diagnostic.bridgePhase = "ui-init";
    syncPreferencesIntoState();
    setState("connected", "Global window connected.");
    syncAll();
  });

  standaloneWindow.onMessage(UI_COMMANDS.REQUEST_DIAGNOSTIC, () => {
    diagnostic.lastUiMessage = UI_COMMANDS.REQUEST_DIAGNOSTIC;
    diagnostic.bridgePhase = "ui-request-diagnostic";
    syncPreferencesIntoState();
    postToWindow(RUNTIME_EVENTS.APP_CONFIG, { ...config });
    postToWindow(RUNTIME_EVENTS.APP_DIAGNOSTIC, { ...diagnostic });
  });

  standaloneWindow.onMessage(UI_COMMANDS.REQUEST_RUNTIME_SYNC, () => {
    diagnostic.lastUiMessage = UI_COMMANDS.REQUEST_RUNTIME_SYNC;
    diagnostic.bridgePhase = "ui-request-runtime-sync";
    syncPreferencesIntoState();
    syncAll();
  });

  standaloneWindow.onMessage(UI_COMMANDS.PLAY_EPISODE, (payload: PlayEpisodeCommand) => {
    diagnostic.lastUiMessage = UI_COMMANDS.PLAY_EPISODE;
    diagnostic.bridgePhase = "ui-play-episode";
    rememberPlayMeta(payload, "single");
    handoffToStandardPlayer(payload, "episode");
  });

  standaloneWindow.onMessage(UI_COMMANDS.PLAY_ALL, (payload: PlayAllCommand) => {
    diagnostic.lastUiMessage = UI_COMMANDS.PLAY_ALL;
    diagnostic.bridgePhase = "ui-play-all";
    rememberPlayMeta(payload, "playlist");
    handoffToStandardPlayer(payload, "playlist");
  });
}

function ensureWindow(): void {
  standaloneWindow.setProperty({
    title: PLUGIN_METADATA.name,
    resizable: true,
    fullSizeContentView: true,
  });

  if (!windowLoaded) {
    standaloneWindow.loadFile(UI_HTML_PATH);
    windowLoaded = true;
    diagnostic.bridgePhase = "window-file-loaded";
    ensureWindowMessaging();
  }

  standaloneWindow.open();
  diagnostic.bridgePhase = "window-opened";
}

function createManagedPlayer(payload?: PlayEpisodeCommand | PlayAllCommand): void {
  activePlayerLabel = PLAYER_LABEL;
  playerReady = false;
  playerWindowLoaded = false;
  const entryIndex =
    payload && "episodeIndex" in payload
      ? payload.episodeIndex
      : payload && "startEpisodeIndex" in payload
        ? payload.startEpisodeIndex
        : 0;
  const initialUrl =
    payload &&
    Array.isArray(payload.entries) &&
    payload.entries[entryIndex] &&
    payload.entries[entryIndex].url
      ? String(payload.entries[entryIndex].url)
      : "";
  activePlayerId = global.createPlayerInstance({
    label: PLAYER_LABEL,
    enablePlugins: false,
    url: initialUrl || undefined,
  });
  bootstrapEpisodePending = Boolean(
    payload && "episodeIndex" in payload,
  );
  bootstrapPlaylistPending = Boolean(
    payload &&
      "startEpisodeIndex" in payload &&
      !payload.preservePlaylistOrder,
  );
  diagnostic.activePlayerLabel = activePlayerLabel;
  diagnostic.playerReady = false;
  diagnostic.bridgePhase = "creating-managed-player";
}

function dispatchToPlayer(payload: PlayEpisodeCommand | PlayAllCommand): void {
  if (!activePlayerLabel) {
    createManagedPlayer(payload);
  }

  if (!playerReady) {
    pendingCommand = payload;
    diagnostic.pendingCommandName =
      "episodeIndex" in payload ? UI_COMMANDS.PLAY_EPISODE : UI_COMMANDS.PLAY_ALL;
    diagnostic.bridgePhase = "waiting-player-ready";
    setState("loading", "Dang mo player...");
    syncAll();
    return;
  }

  pendingCommand = null;
  diagnostic.pendingCommandName = "";
  const target = activePlayerId ?? activePlayerLabel;

  if (bootstrapEpisodePending && "episodeIndex" in payload) {
    bootstrapEpisodePending = false;
    diagnostic.bridgePhase = "forwarded-bootstrap-episode";
    global.postMessage(target, GLOBAL_MESSAGES.PLAYER_BOOTSTRAP_EPISODE, payload);
  } else if (bootstrapPlaylistPending && "startEpisodeIndex" in payload) {
    bootstrapPlaylistPending = false;
    diagnostic.bridgePhase = "forwarded-bootstrap-playlist";
    global.postMessage(target, GLOBAL_MESSAGES.PLAYER_BOOTSTRAP_PLAYLIST, payload);
  } else if ("episodeIndex" in payload) {
    diagnostic.bridgePhase = "forwarded-play-episode";
    global.postMessage(target, GLOBAL_MESSAGES.PLAYER_PLAY_EPISODE, payload);
  } else {
    diagnostic.bridgePhase = "forwarded-play-all";
    global.postMessage(target, GLOBAL_MESSAGES.PLAYER_PLAY_ALL, payload);
  }
}

function scheduleDispatchAfterReady(payload: PlayEpisodeCommand | PlayAllCommand): void {
  if (readyDispatchTimer) {
    clearTimeout(readyDispatchTimer);
  }

  pendingCommand = payload;
  diagnostic.pendingCommandName =
    "episodeIndex" in payload ? UI_COMMANDS.PLAY_EPISODE : UI_COMMANDS.PLAY_ALL;
  diagnostic.bridgePhase = playerWindowLoaded
    ? "waiting-player-dispatch"
    : "waiting-player-window-loaded";
  setState("loading", "Dang cho player san sang...");
  syncAll();

  readyDispatchTimer = setTimeout(() => {
    if (!pendingCommand) {
      return;
    }
    const next = pendingCommand;
    dispatchToPlayer(next);
  }, playerWindowLoaded ? 50 : 250);
}

function rememberPlayMeta(payload: PlayEpisodeCommand | PlayAllCommand, mode: string): void {
  diagnostic.playStage = mode === "single" ? "forward-to-player-single" : "forward-to-player-playlist";
  diagnostic.lastPlayRequestId = payload.requestId || "";
  diagnostic.lastPlayMode = mode;
  diagnostic.lastPlayTitle = payload.title || "";
  const index = "episodeIndex" in payload ? payload.episodeIndex : payload.startEpisodeIndex;
  diagnostic.lastPlayEntryUrl =
    Array.isArray(payload.entries) && payload.entries[index]
      ? String(payload.entries[index].url || "")
      : "";
}

global.onMessage(GLOBAL_MESSAGES.PLAYER_READY, (_payload: unknown, player?: string) => {
  if (player && activePlayerId !== null && player !== String(activePlayerId)) {
    return;
  }

  activePlayerLabel = player || activePlayerLabel || PLAYER_LABEL;
  playerReady = true;
  diagnostic.activePlayerLabel = activePlayerLabel;
  diagnostic.playerReady = true;
  diagnostic.bridgePhase = "player-ready-received";
  if (pendingCommand) {
    const next = pendingCommand;
    scheduleDispatchAfterReady(next);
    return;
  }

  setState("ready", "Player da san sang.");
  syncAll();
});

global.onMessage(GLOBAL_MESSAGES.PLAYER_WINDOW_LOADED, (_payload: unknown, player?: string) => {
  if (player && activePlayerId !== null && player !== String(activePlayerId)) {
    return;
  }

  playerWindowLoaded = true;
  diagnostic.bridgePhase = "player-window-loaded-received";
  if (pendingCommand) {
    const next = pendingCommand;
    scheduleDispatchAfterReady(next);
  }
});

global.onMessage(GLOBAL_MESSAGES.PLAYER_CLOSED, (_payload: unknown, player?: string) => {
  if (player && activePlayerId !== null && player !== String(activePlayerId)) {
    return;
  }

  playerReady = false;
  playerWindowLoaded = false;
  if (readyDispatchTimer) {
    clearTimeout(readyDispatchTimer);
    readyDispatchTimer = null;
  }
  activePlayerId = null;
  activePlayerLabel = "";
  bootstrapEpisodePending = false;
  bootstrapPlaylistPending = false;
  diagnostic.activePlayerLabel = "";
  diagnostic.playerReady = false;
  diagnostic.pendingCommandName = "";
  diagnostic.bridgePhase = "player-closed";
  setState("ready", "Player da dong.");
  syncAll();
});

global.onMessage(
  GLOBAL_MESSAGES.PLAYER_APP_STATE,
  (payload: AppStatePayload, player?: string) => {
    if (player && activePlayerId !== null && player !== String(activePlayerId)) {
      return;
    }

    diagnostic.bridgePhase = "player-app-state";
    setState(payload?.status || "unknown", payload?.message || "");
    postToWindow(RUNTIME_EVENTS.APP_STATE, { ...state });
  },
);

global.onMessage(
  GLOBAL_MESSAGES.PLAYER_PLAY_RESULT,
  (payload: AppPlayResultPayload, player?: string) => {
    if (player && activePlayerId !== null && player !== String(activePlayerId)) {
      return;
    }

    diagnostic.bridgePhase = "player-play-result";
    postToWindow(RUNTIME_EVENTS.APP_PLAY_RESULT, payload);
    postToWindow(RUNTIME_EVENTS.APP_DIAGNOSTIC, { ...diagnostic });
  },
);

global.onMessage(
  GLOBAL_MESSAGES.PLAYER_PLAYBACK_STATE,
  (payload: AppPlaybackStatePayload, player?: string) => {
    if (player && activePlayerId !== null && player !== String(activePlayerId)) {
      return;
    }

    diagnostic.bridgePhase = "player-playback-state";
    postToWindow(RUNTIME_EVENTS.APP_PLAYBACK_STATE, payload);
    postToWindow(RUNTIME_EVENTS.APP_DIAGNOSTIC, { ...diagnostic });
  },
);

global.onMessage(GLOBAL_MESSAGES.PLAYER_WINDOW_VISIBLE, (payload: any, player?: string) => {
  if (player && activePlayerId !== null && player !== String(activePlayerId)) {
    return;
  }

  diagnostic.playerWindowVisible = Boolean(payload?.visible);
  diagnostic.playerWindowMiniaturized = Boolean(payload?.miniaturized);
  diagnostic.playerWindowPip = Boolean(payload?.pip);
  diagnostic.playerWindowFrame = payload?.frame ? String(payload.frame) : "";
  diagnostic.playerStatusUrl = payload?.statusUrl ? String(payload.statusUrl) : "";
  diagnostic.bridgePhase = "player-window-visible";
});

menu.addItem(
  menu.item("Open Cinema", () => {
    syncPreferencesIntoState();
    ensureWindow();
    syncAll();
  }),
);

syncPreferencesIntoState();
setState("ready", "Global browser ready.");
