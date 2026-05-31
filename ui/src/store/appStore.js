import { create } from "zustand";

const DEFAULT_SOURCES = [
  { id: "ophim", label: "OPhim", enabled: true },
  { id: "kkphim", label: "KKPhim", enabled: false },
  { id: "mock", label: "Mock", enabled: true },
];

function createInitialCatalog(sourceId = "ophim") {
  return {
    sourceId,
    mode: "home",
    title: "Trang chủ",
    subtitle: "Đợi dữ liệu...",
    items: [],
    categories: [],
    activeCategory: "",
    keyword: "",
    error: "",
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
    },
  };
}

function createInitialDetail() {
  return {
    data: null,
    error: "",
  };
}

function createInitialPlayback() {
  return {
    active: false,
    sourceId: "",
    movieId: "",
    detailSlug: "",
    title: "",
    episodeName: "",
    episodeIndex: -1,
    serverId: "",
    url: "",
    pendingRequestId: "",
  };
}

export const useAppStore = create((set) => ({
  sources: DEFAULT_SOURCES,
  activeSourceId: "ophim",
  connected: false,
  status: "booting",
  message: "Khoi tao React shell...",
  view: "catalog",
  lastEventName: "",
  runtimeEventCount: 0,
  catalog: createInitialCatalog("ophim"),
  detail: createInitialDetail(),
  playback: createInitialPlayback(),
  diagnostic: {
    pluginVersion: "",
    sidebarLoaded: false,
    windowLoaded: false,
    lastOutboundCommand: "",
    lastUiMessage: "",
    lastAppMessage: "",
    lastError: "",
    playStage: "",
    lastPlayRequestId: "",
    lastPlayMode: "",
    lastPlayTitle: "",
    lastPlayEntryUrl: "",
  },
  setActiveSource(sourceId) {
    set({
      activeSourceId: sourceId,
      view: "catalog",
      status: "loading",
      message: "Đang đổi nguồn...",
      catalog: createInitialCatalog(sourceId),
      detail: createInitialDetail(),
      playback: Object.assign({}, createInitialPlayback()),
    });
  },
  setStatus(status, message) {
    set({
      status,
      message: message || "",
    });
  },
  setCatalogLoading(message) {
    set({
      view: "catalog",
      status: "loading",
      message,
      detail: createInitialDetail(),
    });
  },
  setCatalogError(message) {
    set((state) => ({
      view: "catalog",
      status: "error",
      message: "Không tải được catalog.",
      catalog: Object.assign({}, state.catalog, {
        error: message,
      }),
    }));
  },
  applyCatalogPayload(payload, sourceId) {
    set({
      view: "catalog",
      status: "ready",
      message: "Đã tải dữ liệu từ " + sourceId + ".",
      detail: createInitialDetail(),
      catalog: {
        sourceId,
        mode: payload && payload.mode ? payload.mode : "home",
        title: payload && payload.title ? payload.title : "Catalog",
        subtitle: payload && payload.subtitle ? payload.subtitle : "",
        items: payload && Array.isArray(payload.items) ? payload.items : [],
        categories:
          payload && Array.isArray(payload.categories)
            ? payload.categories
            : [],
        activeCategory:
          payload && payload.activeCategory ? payload.activeCategory : "",
        keyword: payload && payload.keyword ? payload.keyword : "",
        error: "",
        pagination:
          payload && payload.pagination
            ? payload.pagination
            : { currentPage: 1, totalPages: 1, totalItems: 0 },
      },
    });
  },
  appendCatalogPayload(payload) {
    set((state) => ({
      status: "ready",
      message: "Đã tải thêm dữ liệu.",
      catalog: Object.assign({}, state.catalog, {
        items: (state.catalog.items || []).concat(
          payload && Array.isArray(payload.items) ? payload.items : [],
        ),
        pagination:
          payload && payload.pagination
            ? payload.pagination
            : state.catalog.pagination,
      }),
    }));
  },
  setDetailLoading(message) {
    set({
      status: "loading",
      message,
      detail: {
        data: null,
        error: "",
      },
    });
  },
  setDetailError(message) {
    set({
      status: "error",
      message: "Không tải được chi tiết phim.",
      detail: {
        data: null,
        error: message,
      },
    });
  },
  applyDetailPayload(payload) {
    set({
      view: "detail",
      status: "ready",
      message: "Đã tải chi tiết phim.",
      detail: {
        data: payload || null,
        error: "",
      },
    });
  },
  closeDetail() {
    set({
      view: "catalog",
      status: "ready",
      message: "Đã quay lại danh sách.",
    });
  },
  selectDetailServer(index) {
    set((state) => {
      const detail = state.detail.data;
      const servers = detail && Array.isArray(detail.servers) ? detail.servers : [];
      const server = servers[index] || null;
      if (!detail || !server) {
        return state;
      }

      return {
        detail: {
          data: Object.assign({}, detail, {
            activeServerIndex: index,
            serverName: server.name,
            entries: Array.isArray(server.entries) ? server.entries : [],
          }),
          error: "",
        },
        message: "Đã chọn server: " + server.name,
      };
    });
  },
  setPendingPlayRequest(requestId) {
    set((state) => ({
      playback: Object.assign({}, state.playback, {
        pendingRequestId: requestId || "",
      }),
    }));
  },
  recordOutboundCommand(commandName) {
    set((state) => ({
      diagnostic: Object.assign({}, state.diagnostic, {
        lastOutboundCommand: commandName || "",
      }),
    }));
  },
  applyPlayResult(payload) {
    set((state) => {
      const requestId = payload && payload.requestId ? String(payload.requestId) : "";
      if (requestId && state.playback.pendingRequestId && requestId !== state.playback.pendingRequestId) {
        return state;
      }

      const ok = Boolean(payload && payload.ok);
      return {
        status: ok ? "ready" : "error",
        message: ok
          ? payload && payload.mode === "playlist"
            ? "Đã thêm toàn bộ tập vào playlist."
            : "Đang phát phim."
          : "Không phát được phim.",
        playback: Object.assign({}, state.playback, {
          pendingRequestId: "",
        }),
        diagnostic: ok
          ? state.diagnostic
          : Object.assign({}, state.diagnostic, {
              lastError:
                payload && payload.error ? String(payload.error) : "Không phát được phim.",
            }),
      };
    });
  },
  applyPlaybackState(payload) {
    set((state) => ({
      playback: {
        pendingRequestId: state.playback.pendingRequestId,
        active: Boolean(payload && payload.active),
        sourceId: payload && payload.sourceId ? String(payload.sourceId) : "",
        movieId: payload && payload.movieId ? String(payload.movieId) : "",
        detailSlug: payload && payload.detailSlug ? String(payload.detailSlug) : "",
        title: payload && payload.title ? String(payload.title) : "",
        episodeName: payload && payload.episodeName ? String(payload.episodeName) : "",
        episodeIndex:
          payload && typeof payload.episodeIndex === "number"
            ? payload.episodeIndex
            : -1,
        serverId: payload && payload.serverId ? String(payload.serverId) : "",
        url: payload && payload.url ? String(payload.url) : "",
      },
      lastEventName: "app_playback_state",
      runtimeEventCount: state.runtimeEventCount + 1,
    }));
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
        pluginVersion:
          payload && payload.pluginVersion ? payload.pluginVersion : "",
        sidebarLoaded: Boolean(payload && payload.sidebarLoaded),
        windowLoaded: Boolean(payload && payload.windowLoaded),
        lastOutboundCommand: state.diagnostic.lastOutboundCommand,
        lastUiMessage:
          payload && payload.lastUiMessage ? payload.lastUiMessage : "",
        lastAppMessage:
          payload && payload.lastAppMessage ? payload.lastAppMessage : "",
        lastError: payload && payload.lastError ? payload.lastError : "",
        playStage: payload && payload.playStage ? payload.playStage : "",
        lastPlayRequestId:
          payload && payload.lastPlayRequestId ? payload.lastPlayRequestId : "",
        lastPlayMode:
          payload && payload.lastPlayMode ? payload.lastPlayMode : "",
        lastPlayTitle:
          payload && payload.lastPlayTitle ? payload.lastPlayTitle : "",
        lastPlayEntryUrl:
          payload && payload.lastPlayEntryUrl ? payload.lastPlayEntryUrl : "",
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
