import { create } from "zustand";

const DEFAULT_SOURCES = [
  { id: "ophim", label: "OPhim", enabled: true },
  { id: "kkphim", label: "KKPhim", enabled: true },
];
export const HISTORY_CATEGORY_SLUG = "__history__";

function createInitialCatalog(sourceId = "ophim") {
  return {
    sourceId,
    mode: "history",
    title: "Lịch sử xem",
    subtitle: "Các playlist gần đây",
    items: [],
    categories: [],
    activeCategory: HISTORY_CATEGORY_SLUG,
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

function toHistoryEntryId(payload) {
  return [
    payload && payload.sourceId ? payload.sourceId : "",
    payload && payload.detailSlug ? payload.detailSlug : "",
    payload && payload.serverId ? payload.serverId : "",
  ].join(":");
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
  history: [],
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
      message: "Đang mở lịch sử...",
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
  hydrateHistory(entries) {
    set((state) => ({
      history: Array.isArray(entries) ? entries.slice(0, 12) : [],
      catalog:
        state.catalog.activeCategory === HISTORY_CATEGORY_SLUG
          ? Object.assign({}, state.catalog, {
              mode: "history",
              title: "Lịch sử xem",
              subtitle: "Các playlist gần đây",
            })
          : state.catalog,
    }));
  },
  rememberHistoryEntry(payload) {
    set((state) => {
      const entry = {
        id: toHistoryEntryId(payload),
        sourceId: payload && payload.sourceId ? String(payload.sourceId) : "",
        movieId: payload && payload.movieId ? String(payload.movieId) : "",
        detailSlug:
          payload && payload.detailSlug ? String(payload.detailSlug) : "",
        title: payload && payload.title ? String(payload.title) : "Movie",
        originName:
          payload && payload.originName ? String(payload.originName) : "",
        posterUrl: payload && payload.posterUrl ? String(payload.posterUrl) : "",
        serverId: payload && payload.serverId ? String(payload.serverId) : "",
        serverName:
          payload && payload.serverName ? String(payload.serverName) : "",
        entries:
          payload && Array.isArray(payload.entries)
            ? payload.entries.map((item) => ({
                name: item && item.name ? String(item.name) : "",
                slug: item && item.slug ? String(item.slug) : "",
                url: item && item.url ? String(item.url) : "",
              }))
            : [],
        episodeIndex:
          payload && typeof payload.episodeIndex === "number"
            ? payload.episodeIndex
            : payload && typeof payload.startEpisodeIndex === "number"
              ? payload.startEpisodeIndex
              : 0,
        episodeName:
          payload && payload.episodeName ? String(payload.episodeName) : "",
        updatedAt: new Date().toISOString(),
      };

      const nextHistory = [entry]
        .concat((state.history || []).filter((item) => item.id !== entry.id))
        .slice(0, 12);

      return {
        history: nextHistory,
      };
    });
  },
  removeHistoryEntry(entryId) {
    set((state) => ({
      history: (state.history || []).filter((item) => item.id !== entryId),
    }));
  },
  clearHistory() {
    set({
      history: [],
    });
  },
  showHistoryCatalog() {
    set({
      view: "catalog",
      status: "ready",
      message: "Đang xem lịch sử.",
      catalog: {
        sourceId: "",
        mode: "history",
        title: "Lịch sử xem",
        subtitle: "Các playlist gần đây",
        items: [],
        categories: [],
        activeCategory: HISTORY_CATEGORY_SLUG,
        keyword: "",
        error: "",
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
        },
      },
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
      history: (state.history || []).map((item) => {
        const isSamePlayback =
          item.detailSlug &&
          payload &&
          item.detailSlug === String(payload.detailSlug || "") &&
          item.serverId === String(payload.serverId || "");
        if (!isSamePlayback) {
          return item;
        }

        return Object.assign({}, item, {
          episodeIndex:
            payload && typeof payload.episodeIndex === "number"
              ? payload.episodeIndex
              : item.episodeIndex,
          episodeName:
            payload && payload.episodeName
              ? String(payload.episodeName)
              : item.episodeName,
          updatedAt: new Date().toISOString(),
        });
      }),
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
