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
  };
}
