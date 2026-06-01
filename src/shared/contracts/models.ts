export interface ProviderCategory {
  slug: string;
  label: string;
}

export interface CatalogItem {
  sourceId: string;
  id: string;
  slug: string;
  name: string;
  originName: string;
  posterUrl: string;
  year: string;
  quality: string;
  lang: string;
  episodeCurrent: string;
  type: string;
}

export interface ProviderEntry {
  name: string;
  slug: string;
  url: string;
}

export interface ProviderServer {
  id: string;
  index: number;
  name: string;
  entries: ProviderEntry[];
}

export interface ProviderDetail {
  sourceId: string;
  movieId: string;
  slug: string;
  title: string;
  originName: string;
  posterUrl: string;
  content: string;
  quality: string;
  lang: string;
  year: string;
  time: string;
  episodeCurrent: string;
  serverName: string;
  activeServerIndex: number;
  servers: ProviderServer[];
  entries: ProviderEntry[];
  historyEpisodeIndex?: number;
  historyEpisodeName?: string;
  historyServerId?: string;
}

export interface CatalogPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface CatalogPayload {
  mode: string;
  title: string;
  subtitle: string;
  keyword: string;
  items: CatalogItem[];
  categories: ProviderCategory[];
  activeCategory: string;
  pagination: CatalogPagination;
}

export interface PlayEpisodeCommand {
  requestId: string;
  sourceId: string;
  movieId: string;
  detailSlug: string;
  title: string;
  serverId: string;
  episodeIndex: number;
  episodeName: string;
  entries: ProviderEntry[];
}

export interface PlayAllCommand {
  requestId: string;
  sourceId: string;
  movieId: string;
  detailSlug: string;
  title: string;
  serverId: string;
  startEpisodeIndex: number;
  preservePlaylistOrder?: boolean;
  entries: ProviderEntry[];
}

export interface RequestDiagnosticCommand {
  requestId: string;
}

export interface AppStatePayload {
  status: string;
  message: string;
}

export interface AppPlayResultPayload {
  requestId: string;
  ok: boolean;
  mode?: string;
  count?: number;
  error?: string;
}

export interface AppPlaybackStatePayload {
  active: boolean;
  sourceId: string;
  movieId: string;
  detailSlug: string;
  title: string;
  episodeName: string;
  episodeIndex: number;
  serverId: string;
  url: string;
}

export interface AppDiagnosticPayload {
  pluginVersion: string;
  sidebarLoaded: boolean;
  windowLoaded: boolean;
  lastUiMessage: string;
  lastAppMessage: string;
  lastError: string;
  playStage?: string;
  lastPlayRequestId?: string;
  lastPlayMode?: string;
  lastPlayTitle?: string;
  lastPlayEntryUrl?: string;
  runtimeMode?: string;
  bridgePhase?: string;
  activePlayerLabel?: string;
  playerReady?: boolean;
  pendingCommandName?: string;
  playerWindowVisible?: boolean;
  playerWindowMiniaturized?: boolean;
  playerWindowPip?: boolean;
  playerWindowFrame?: string;
  playerStatusUrl?: string;
  playerVideoWidth?: number;
  playerVideoHeight?: number;
  playerPaused?: boolean;
  playerIdle?: boolean;
}

export interface AppConfigPayload {
  ophimApiBase: string;
  kkphimApiBase: string;
}

export const COMMAND_MODEL_SHAPES = {
  playEpisode: {
    requestId: "string",
    sourceId: "string",
    movieId: "string",
    detailSlug: "string",
    title: "string",
    serverId: "string",
    episodeIndex: "number",
    episodeName: "string",
    entries: "array",
  },
  playAll: {
    requestId: "string",
    sourceId: "string",
    movieId: "string",
    detailSlug: "string",
    title: "string",
    serverId: "string",
    startEpisodeIndex: "number",
    preservePlaylistOrder: "boolean?",
    entries: "array",
  },
  requestDiagnostic: {
    requestId: "string",
  },
} as const;

export const EVENT_MODEL_SHAPES = {
  appState: {
    status: "string",
    message: "string",
  },
  appPlayResult: {
    requestId: "string",
    ok: "boolean",
    mode: "string",
    count: "number?",
    error: "string?",
  },
  appPlaybackState: {
    active: "boolean",
    sourceId: "string",
    movieId: "string",
    detailSlug: "string",
    title: "string",
    episodeName: "string",
    episodeIndex: "number",
    serverId: "string",
    url: "string",
  },
  appDiagnostic: {
    pluginVersion: "string",
    sidebarLoaded: "boolean",
    windowLoaded: "boolean",
    lastUiMessage: "string",
    lastAppMessage: "string",
    lastError: "string",
  },
  appConfig: {
    ophimApiBase: "string",
    kkphimApiBase: "string",
  },
} as const;
