import { create } from "zustand";

const DEFAULT_SOURCES = [
  { id: "ophim", label: "OPhim", enabled: true },
  { id: "kkphim", label: "KKPhim", enabled: false },
  { id: "mock", label: "Mock", enabled: true },
];

export const useAppStore = create((set) => ({
  sources: DEFAULT_SOURCES,
  activeSourceId: "ophim",
  connected: false,
  status: "booting",
  message: "Khoi tao React shell...",
  lastEventName: "",
  runtimeEventCount: 0,
  catalog: {
    sourceId: "",
    mode: "home",
    title: "",
    subtitle: "",
    items: [],
    categories: [],
    activeCategory: "",
    keyword: "",
    error: "",
  },
  diagnostic: {
    pluginVersion: "",
    sidebarLoaded: false,
    windowLoaded: false,
    lastUiMessage: "",
    lastAppMessage: "",
    lastError: "",
  },
  setActiveSource(sourceId) {
    set((state) => ({
      activeSourceId: sourceId,
      catalog: Object.assign({}, state.catalog, {
        sourceId,
        items: [],
        categories: [],
        activeCategory: "",
        keyword: "",
        error: "",
      }),
    }));
  },
  setCatalogLoading(message) {
    set({
      status: "loading",
      message,
    });
  },
  setCatalogError(message) {
    set((state) => ({
      status: "error",
      message: "Không tải được catalog.",
      catalog: Object.assign({}, state.catalog, {
        error: message,
        items: [],
      }),
    }));
  },
  applyCatalogPayload(payload, sourceId) {
    set({
      status: "ready",
      message: "Đã tải dữ liệu từ " + sourceId + ".",
      catalog: {
        sourceId,
        mode: payload && payload.mode ? payload.mode : "home",
        title: payload && payload.title ? payload.title : "Catalog",
        subtitle: payload && payload.subtitle ? payload.subtitle : "",
        items: payload && Array.isArray(payload.items) ? payload.items : [],
        categories: payload && Array.isArray(payload.categories) ? payload.categories : [],
        activeCategory: payload && payload.activeCategory ? payload.activeCategory : "",
        keyword: payload && payload.keyword ? payload.keyword : "",
        error: "",
      },
    });
  },
  applyAppState(payload) {
    set((state) => ({
      connected: true,
      status: payload && payload.status ? payload.status : "unknown",
      message: payload && payload.message ? payload.message : "",
      lastEventName: "app_state",
      runtimeEventCount: state.runtimeEventCount + 1,
    }));
  },
  applyDiagnostic(payload) {
    set((state) => ({
      connected: true,
      lastEventName: "app_diagnostic",
      runtimeEventCount: state.runtimeEventCount + 1,
      diagnostic: {
        pluginVersion: payload && payload.pluginVersion ? payload.pluginVersion : "",
        sidebarLoaded: Boolean(payload && payload.sidebarLoaded),
        windowLoaded: Boolean(payload && payload.windowLoaded),
        lastUiMessage: payload && payload.lastUiMessage ? payload.lastUiMessage : "",
        lastAppMessage: payload && payload.lastAppMessage ? payload.lastAppMessage : "",
        lastError: payload && payload.lastError ? payload.lastError : "",
      },
    }));
  },
  recordRuntimeEvent(eventName) {
    set((state) => ({
      lastEventName: eventName,
      runtimeEventCount: state.runtimeEventCount + 1,
    }));
  },
}));
