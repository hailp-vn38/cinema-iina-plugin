import type {
  AppConfigPayload,
  AppDiagnosticPayload,
  AppPlaybackStatePayload,
  AppPlayResultPayload,
  AppStatePayload,
  CatalogItem,
  CatalogPagination,
  CatalogPayload,
  ProviderCategory,
  ProviderDetail,
  ProviderEntry,
} from "@shared/contracts/models";

export interface SourceOption {
  id: string;
  label: string;
  enabled: boolean;
}

export interface FavoriteEntry {
  id: string;
  sourceId: string;
  movieId: string;
  detailSlug: string;
  title: string;
  originName: string;
  posterUrl: string;
  serverId: string;
  serverName: string;
  entries: ProviderEntry[];
  episodeIndex: number;
  episodeName: string;
  updatedAt: string;
}

export interface CatalogState {
  sourceId: string;
  mode: string;
  title: string;
  subtitle: string;
  items: CatalogItem[];
  categories: ProviderCategory[];
  activeCategory: string;
  keyword: string;
  error: string;
  pagination: CatalogPagination;
}

export interface DetailState {
  data: ProviderDetail | null;
  error: string;
}

export interface PlaybackState extends AppPlaybackStatePayload {
  pendingRequestId: string;
}

export interface DiagnosticState extends AppDiagnosticPayload {
  lastOutboundCommand: string;
}

export interface FavoriteEntryInput {
  sourceId?: string;
  movieId?: string;
  detailSlug?: string;
  title?: string;
  originName?: string;
  posterUrl?: string;
  serverId?: string;
  serverName?: string;
  entries?: ProviderEntry[];
  episodeIndex?: number;
  startEpisodeIndex?: number;
  episodeName?: string;
}

export interface AppStoreState {
  sources: SourceOption[];
  activeSourceId: string;
  connected: boolean;
  status: string;
  message: string;
  view: string;
  lastEventName: string;
  runtimeEventCount: number;
  catalog: CatalogState;
  detail: DetailState;
  playback: PlaybackState;
  favorites: FavoriteEntry[];
  diagnostic: DiagnosticState;
  config: AppConfigPayload;
  setActiveSource: (sourceId: string) => void;
  setStatus: (status: string, message?: string) => void;
  hydrateFavorites: (entries: FavoriteEntry[]) => void;
  toggleFavoriteEntry: (payload: FavoriteEntryInput) => void;
  updateFavoriteProgress: (payload: FavoriteEntryInput) => void;
  removeFavoriteEntry: (entryId: string) => void;
  clearFavorites: () => void;
  showFavoritesCatalog: () => void;
  setCatalogLoading: (message: string) => void;
  setCatalogError: (message: string) => void;
  applyCatalogPayload: (payload: CatalogPayload, sourceId: string) => void;
  appendCatalogPayload: (payload: CatalogPayload) => void;
  setDetailLoading: (message: string) => void;
  setDetailError: (message: string) => void;
  applyDetailPayload: (payload: ProviderDetail | null) => void;
  closeDetail: () => void;
  selectDetailServer: (index: number) => void;
  setPendingPlayRequest: (requestId: string) => void;
  recordOutboundCommand: (commandName: string) => void;
  applyPlayResult: (payload: AppPlayResultPayload) => void;
  applyPlaybackState: (payload: AppPlaybackStatePayload) => void;
  applyAppState: (payload: AppStatePayload) => void;
  applyDiagnostic: (payload: AppDiagnosticPayload) => void;
  applyConfig: (payload: AppConfigPayload) => void;
  recordRuntimeEvent: (eventName: string) => void;
}
