import type { RuntimeStore } from "../types";
import { DEFAULT_PROVIDER_ENDPOINTS } from "../../shared/constants";

export function createRuntimeStore(): RuntimeStore {
  const store: RuntimeStore = {
    sidebarLoaded: false,
    uiInitialized: false,
    windowLoaded: false,
    state: {
      status: "booting",
      message: "Khoi tao runtime...",
    },
    diagnostic: {
      pluginVersion: "0.1.0",
      sidebarLoaded: false,
      windowLoaded: false,
      lastUiMessage: "",
      lastAppMessage: "",
      lastError: "",
      playStage: "",
      lastPlayRequestId: "",
      lastPlayMode: "",
      lastPlayTitle: "",
      lastPlayEntryUrl: "",
    },
    config: {
      ...DEFAULT_PROVIDER_ENDPOINTS,
    },
    setSidebarLoaded(value) {
      store.sidebarLoaded = value;
      store.diagnostic.sidebarLoaded = value;
    },
    setWindowLoaded(value) {
      store.windowLoaded = value;
      store.diagnostic.windowLoaded = value;
    },
    setUiInitialized(value) {
      store.uiInitialized = value;
    },
    setConfig(payload) {
      store.config = {
        ophimApiBase: payload.ophimApiBase || DEFAULT_PROVIDER_ENDPOINTS.ophimApiBase,
        kkphimApiBase: payload.kkphimApiBase || DEFAULT_PROVIDER_ENDPOINTS.kkphimApiBase,
      };
    },
    setState(status, message) {
      store.state = { status, message };
    },
    setLastUiMessage(name) {
      store.diagnostic.lastUiMessage = name;
    },
    setLastAppMessage(name) {
      store.diagnostic.lastAppMessage = name;
    },
    setLastError(message) {
      store.diagnostic.lastError = message;
    },
    setPlayStage(stage) {
      store.diagnostic.playStage = stage || "";
    },
    setPlayPayloadMeta(payload) {
      store.diagnostic.lastPlayRequestId =
        payload?.requestId ? String(payload.requestId) : "";
      store.diagnostic.lastPlayMode = payload?.mode ? String(payload.mode) : "";
      store.diagnostic.lastPlayTitle =
        payload?.title ? String(payload.title) : "";
      store.diagnostic.lastPlayEntryUrl = payload?.url ? String(payload.url) : "";
    },
  };

  return store;
}
