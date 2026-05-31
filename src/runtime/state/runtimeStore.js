export function createRuntimeStore() {
  return {
    sidebarLoaded: false,
    uiInitialized: false,
    windowLoaded: false,
    state: {
      status: "booting",
      message: "Khoi tao runtime...",
    },
    diagnostic: {
      pluginVersion: "0.2.0-dev.0",
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
    setSidebarLoaded(value) {
      this.sidebarLoaded = value;
      this.diagnostic.sidebarLoaded = value;
    },
    setWindowLoaded(value) {
      this.windowLoaded = value;
      this.diagnostic.windowLoaded = value;
    },
    setUiInitialized(value) {
      this.uiInitialized = value;
    },
    setState(status, message) {
      this.state = { status, message };
    },
    setLastUiMessage(name) {
      this.diagnostic.lastUiMessage = name;
    },
    setLastAppMessage(name) {
      this.diagnostic.lastAppMessage = name;
    },
    setLastError(message) {
      this.diagnostic.lastError = message;
    },
    setPlayStage(stage) {
      this.diagnostic.playStage = stage || "";
    },
    setPlayPayloadMeta(payload) {
      this.diagnostic.lastPlayRequestId =
        payload && payload.requestId ? String(payload.requestId) : "";
      this.diagnostic.lastPlayMode =
        payload && payload.mode ? String(payload.mode) : "";
      this.diagnostic.lastPlayTitle =
        payload && payload.title ? String(payload.title) : "";
      this.diagnostic.lastPlayEntryUrl =
        payload && payload.url ? String(payload.url) : "";
    },
  };
}
