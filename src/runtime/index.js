import { createRuntimeBus } from "./bridge/runtimeBus.js";
import { registerMessages } from "./bridge/registerMessages.js";
import { createDiagnosticService } from "./services/diagnosticService.js";
import { createPlaybackService } from "./services/playbackService.js";
import { createPlaybackStateService } from "./services/playbackStateService.js";
import { createSidebarSyncService } from "./services/sidebarSyncService.js";
import { createPlaybackStore } from "./state/playbackStore.js";
import { createRuntimeStore } from "./state/runtimeStore.js";

const { console, core, event, mpv, sidebar } = iina;

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

function loadSidebar() {
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

function ensureMessagesRegistered() {
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
  });
}

playbackStateService.register();

event.on("iina.window-loaded", () => {
  runtimeStore.setWindowLoaded(true);
  loadSidebar();
  ensureMessagesRegistered();
  runtimeStore.setState("ready", "Playback runtime ready.");
  sidebarSyncService.syncAll();
});
