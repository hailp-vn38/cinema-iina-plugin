import { create } from "zustand";
import type {
  AppConfigPayload,
  AppDiagnosticPayload,
  AppPlaybackStatePayload,
  AppPlayResultPayload,
  AppStatePayload,
  CatalogPayload,
  ProviderDetail,
  ProviderEntry,
  ProviderServer,
} from "@shared/contracts/models";
import type {
  AppStoreState,
  CatalogState,
  DetailState,
  DiagnosticState,
  HistoryEntry,
  HistoryEntryInput,
  PlaybackState,
  SourceOption,
} from "./types";
import { DEFAULT_PROVIDER_ENDPOINTS } from "@shared/constants";

const DEFAULT_SOURCES: SourceOption[] = [
  { id: "ophim", label: "OPhim", enabled: true },
  { id: "kkphim", label: "KKPhim", enabled: true },
];

export const HISTORY_CATEGORY_SLUG = "__history__";

function createInitialCatalog(sourceId = "ophim"): CatalogState {
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

function createInitialDetail(): DetailState {
  return {
    data: null,
    error: "",
  };
}

function createInitialPlayback(): PlaybackState {
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

function createInitialDiagnostic(): DiagnosticState {
  return {
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
  };
}

function toHistoryEntryId(payload: HistoryEntryInput): string {
  return [
    payload.sourceId ? payload.sourceId : "",
    payload.detailSlug ? payload.detailSlug : "",
    payload.serverId ? payload.serverId : "",
  ].join(":");
}

function normalizeEntries(entries?: ProviderEntry[]): ProviderEntry[] {
  return Array.isArray(entries)
    ? entries.map((item) => ({
        name: item?.name ? String(item.name) : "",
        slug: item?.slug ? String(item.slug) : "",
        url: item?.url ? String(item.url) : "",
      }))
    : [];
}

export const useAppStore = create<AppStoreState>((set) => ({
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
  diagnostic: createInitialDiagnostic(),
  config: {
    ...DEFAULT_PROVIDER_ENDPOINTS,
  },
  setActiveSource(sourceId: string) {
    set({
      activeSourceId: sourceId,
      view: "catalog",
      status: "loading",
      message: "Đang mở lịch sử...",
      catalog: createInitialCatalog(sourceId),
      detail: createInitialDetail(),
      playback: { ...createInitialPlayback() },
    });
  },
  setStatus(status: string, message = "") {
    set({
      status,
      message,
    });
  },
  hydrateHistory(entries: HistoryEntry[]) {
    set((state) => ({
      history: Array.isArray(entries) ? entries.slice(0, 12) : [],
      catalog:
        state.catalog.activeCategory === HISTORY_CATEGORY_SLUG
          ? {
              ...state.catalog,
              mode: "history",
              title: "Lịch sử xem",
              subtitle: "Các playlist gần đây",
            }
          : state.catalog,
    }));
  },
  rememberHistoryEntry(payload: HistoryEntryInput) {
    set((state) => {
      const entry: HistoryEntry = {
        id: toHistoryEntryId(payload),
        sourceId: payload.sourceId ? String(payload.sourceId) : "",
        movieId: payload.movieId ? String(payload.movieId) : "",
        detailSlug: payload.detailSlug ? String(payload.detailSlug) : "",
        title: payload.title ? String(payload.title) : "Movie",
        originName: payload.originName ? String(payload.originName) : "",
        posterUrl: payload.posterUrl ? String(payload.posterUrl) : "",
        serverId: payload.serverId ? String(payload.serverId) : "",
        serverName: payload.serverName ? String(payload.serverName) : "",
        entries: normalizeEntries(payload.entries),
        episodeIndex:
          typeof payload.episodeIndex === "number"
            ? payload.episodeIndex
            : typeof payload.startEpisodeIndex === "number"
              ? payload.startEpisodeIndex
              : 0,
        episodeName: payload.episodeName ? String(payload.episodeName) : "",
        updatedAt: new Date().toISOString(),
      };

      return {
        history: [entry]
          .concat((state.history || []).filter((item) => item.id !== entry.id))
          .slice(0, 12),
      };
    });
  },
  removeHistoryEntry(entryId: string) {
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
  setCatalogLoading(message: string) {
    set({
      view: "catalog",
      status: "loading",
      message,
      detail: createInitialDetail(),
    });
  },
  setCatalogError(message: string) {
    set((state) => ({
      view: "catalog",
      status: "error",
      message: "Không tải được catalog.",
      catalog: {
        ...state.catalog,
        error: message,
      },
    }));
  },
  applyCatalogPayload(payload: CatalogPayload, sourceId: string) {
    set({
      view: "catalog",
      status: "ready",
      message: "Đã tải dữ liệu từ " + sourceId + ".",
      detail: createInitialDetail(),
      catalog: {
        sourceId,
        mode: payload?.mode ? payload.mode : "home",
        title: payload?.title ? payload.title : "Catalog",
        subtitle: payload?.subtitle ? payload.subtitle : "",
        items: Array.isArray(payload?.items) ? payload.items : [],
        categories: Array.isArray(payload?.categories) ? payload.categories : [],
        activeCategory: payload?.activeCategory ? payload.activeCategory : "",
        keyword: payload?.keyword ? payload.keyword : "",
        error: "",
        pagination: payload?.pagination
          ? payload.pagination
          : { currentPage: 1, totalPages: 1, totalItems: 0 },
      },
    });
  },
  appendCatalogPayload(payload: CatalogPayload) {
    set((state) => ({
      status: "ready",
      message: "Đã tải thêm dữ liệu.",
      catalog: {
        ...state.catalog,
        items: (state.catalog.items || []).concat(
          Array.isArray(payload?.items) ? payload.items : [],
        ),
        pagination: payload?.pagination
          ? payload.pagination
          : state.catalog.pagination,
      },
    }));
  },
  setDetailLoading(message: string) {
    set({
      status: "loading",
      message,
      detail: {
        data: null,
        error: "",
      },
    });
  },
  setDetailError(message: string) {
    set({
      status: "error",
      message: "Không tải được chi tiết phim.",
      detail: {
        data: null,
        error: message,
      },
    });
  },
  applyDetailPayload(payload: ProviderDetail | null) {
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
  selectDetailServer(index: number) {
    set((state) => {
      const detail = state.detail.data;
      const servers: ProviderServer[] =
        detail && Array.isArray(detail.servers) ? detail.servers : [];
      const server = servers[index] || null;
      if (!detail || !server) {
        return state;
      }

      return {
        detail: {
          data: {
            ...detail,
            activeServerIndex: index,
            serverName: server.name,
            entries: Array.isArray(server.entries) ? server.entries : [],
          },
          error: "",
        },
        message: "Đã chọn server: " + server.name,
      };
    });
  },
  setPendingPlayRequest(requestId: string) {
    set((state) => ({
      playback: {
        ...state.playback,
        pendingRequestId: requestId || "",
      },
    }));
  },
  recordOutboundCommand(commandName: string) {
    set((state) => ({
      diagnostic: {
        ...state.diagnostic,
        lastOutboundCommand: commandName || "",
      },
    }));
  },
  applyPlayResult(payload: AppPlayResultPayload) {
    set((state) => {
      const requestId = payload?.requestId ? String(payload.requestId) : "";
      if (
        requestId &&
        state.playback.pendingRequestId &&
        requestId !== state.playback.pendingRequestId
      ) {
        return state;
      }

      const ok = Boolean(payload?.ok);
      return {
        status: ok ? "ready" : "error",
        message: ok
          ? payload?.mode === "playlist"
            ? "Đã thêm toàn bộ tập vào playlist."
            : "Đang phát phim."
          : "Không phát được phim.",
        playback: {
          ...state.playback,
          pendingRequestId: "",
        },
        diagnostic: ok
          ? state.diagnostic
          : {
              ...state.diagnostic,
              lastError: payload?.error
                ? String(payload.error)
                : "Không phát được phim.",
            },
        lastEventName: "app_play_result",
        runtimeEventCount: state.runtimeEventCount + 1,
      };
    });
  },
  applyPlaybackState(payload: AppPlaybackStatePayload) {
    set((state) => ({
      playback: {
        pendingRequestId: state.playback.pendingRequestId,
        active: Boolean(payload?.active),
        sourceId: payload?.sourceId ? String(payload.sourceId) : "",
        movieId: payload?.movieId ? String(payload.movieId) : "",
        detailSlug: payload?.detailSlug ? String(payload.detailSlug) : "",
        title: payload?.title ? String(payload.title) : "",
        episodeName: payload?.episodeName ? String(payload.episodeName) : "",
        episodeIndex:
          typeof payload?.episodeIndex === "number" ? payload.episodeIndex : -1,
        serverId: payload?.serverId ? String(payload.serverId) : "",
        url: payload?.url ? String(payload.url) : "",
      },
      history: (state.history || []).map((item) => {
        const isSamePlayback =
          item.detailSlug &&
          item.detailSlug === String(payload?.detailSlug || "") &&
          item.serverId === String(payload?.serverId || "");

        if (!isSamePlayback) {
          return item;
        }

        return {
          ...item,
          episodeIndex:
            typeof payload?.episodeIndex === "number"
              ? payload.episodeIndex
              : item.episodeIndex,
          episodeName: payload?.episodeName
            ? String(payload.episodeName)
            : item.episodeName,
          updatedAt: new Date().toISOString(),
        };
      }),
      lastEventName: "app_playback_state",
      runtimeEventCount: state.runtimeEventCount + 1,
    }));
  },
  applyAppState(payload: AppStatePayload) {
    set((state) => ({
      connected: true,
      status: payload?.status ? payload.status : "unknown",
      message: payload?.message ? payload.message : "",
      lastEventName: "app_state",
      runtimeEventCount: state.runtimeEventCount + 1,
    }));
  },
  applyDiagnostic(payload: AppDiagnosticPayload) {
    set((state) => ({
      connected: true,
      lastEventName: "app_diagnostic",
      runtimeEventCount: state.runtimeEventCount + 1,
      diagnostic: {
        pluginVersion: payload?.pluginVersion ? payload.pluginVersion : "",
        sidebarLoaded: Boolean(payload?.sidebarLoaded),
        windowLoaded: Boolean(payload?.windowLoaded),
        lastOutboundCommand: state.diagnostic.lastOutboundCommand,
        lastUiMessage: payload?.lastUiMessage ? payload.lastUiMessage : "",
        lastAppMessage: payload?.lastAppMessage ? payload.lastAppMessage : "",
        lastError: payload?.lastError ? payload.lastError : "",
        playStage: payload?.playStage ? payload.playStage : "",
        lastPlayRequestId: payload?.lastPlayRequestId
          ? payload.lastPlayRequestId
          : "",
        lastPlayMode: payload?.lastPlayMode ? payload.lastPlayMode : "",
        lastPlayTitle: payload?.lastPlayTitle ? payload.lastPlayTitle : "",
        lastPlayEntryUrl: payload?.lastPlayEntryUrl
          ? payload.lastPlayEntryUrl
          : "",
      },
    }));
  },
  applyConfig(payload: AppConfigPayload) {
    set((state) => ({
      connected: true,
      lastEventName: "app_config",
      runtimeEventCount: state.runtimeEventCount + 1,
      config: {
        ophimApiBase:
          String(payload?.ophimApiBase || "").trim() ||
          DEFAULT_PROVIDER_ENDPOINTS.ophimApiBase,
        kkphimApiBase:
          String(payload?.kkphimApiBase || "").trim() ||
          DEFAULT_PROVIDER_ENDPOINTS.kkphimApiBase,
      },
    }));
  },
  recordRuntimeEvent(eventName: string) {
    set((state) => ({
      lastEventName: eventName,
      runtimeEventCount: state.runtimeEventCount + 1,
    }));
  },
}));
