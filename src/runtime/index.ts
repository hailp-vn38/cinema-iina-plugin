import { createRuntimeBus } from "./bridge/runtimeBus";
import { registerMessages } from "./bridge/registerMessages";
import { createDiagnosticService } from "./services/diagnosticService";
import { createPlaybackService } from "./services/playbackService";
import { createPlaybackStateService } from "./services/playbackStateService";
import { createSidebarSyncService } from "./services/sidebarSyncService";
import { createPlaybackStore } from "./state/playbackStore";
import { createRuntimeStore } from "./state/runtimeStore";
import { DEFAULT_PROVIDER_ENDPOINTS } from "../shared/constants";

const { console, core, event, mpv, preferences, sidebar } = iina;

const SIDEBAR_HTML_PATH = "ui/index.html";
const runtimeStore = createRuntimeStore();
const playbackStore = createPlaybackStore();
const bus = createRuntimeBus(sidebar);
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
  sidebar.show();
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

playbackStateService.register();

event.on("iina.window-loaded", () => {
  runtimeStore.setWindowLoaded(true);
  syncPreferencesIntoStore();
  loadSidebar();
  ensureMessagesRegistered();
  runtimeStore.setState("ready", "Playback runtime ready.");
  sidebarSyncService.syncAll();
});
