import type {
  AppDiagnosticPayload,
  AppPlaybackStatePayload,
  AppPlayResultPayload,
  AppStatePayload,
  PlayAllCommand,
  PlayEpisodeCommand,
} from "../shared/contracts/models";

export interface PlaybackEntry {
  name: string;
  url: string;
}

export interface PlaybackContext {
  sourceId: string;
  movieId: string;
  detailSlug: string;
  title: string;
  episodeName: string;
  episodeIndex: number;
  serverId: string;
  url: string;
  entries: PlaybackEntry[];
  playlistToOriginalIndexes: number[];
}

export interface RuntimeStore {
  sidebarLoaded: boolean;
  uiInitialized: boolean;
  windowLoaded: boolean;
  state: AppStatePayload;
  diagnostic: AppDiagnosticPayload;
  setSidebarLoaded: (value: boolean) => void;
  setWindowLoaded: (value: boolean) => void;
  setUiInitialized: (value: boolean) => void;
  setState: (status: string, message: string) => void;
  setLastUiMessage: (name: string) => void;
  setLastAppMessage: (name: string) => void;
  setLastError: (message: string) => void;
  setPlayStage: (stage: string) => void;
  setPlayPayloadMeta: (payload?: {
    requestId?: string;
    mode?: string;
    title?: string;
    url?: string;
  }) => void;
}

export interface PlaybackStore extends PlaybackContext {
  active: boolean;
  setContext: (payload: PlaybackContext) => void;
  setPlaybackPosition: (playlistIndex: number, url: string) => void;
  clear: () => void;
}

export interface RuntimeBus {
  on: (name: string, handler: (payload: any) => void) => void;
  emit: (name: string, payload: unknown) => void;
}

export interface DiagnosticService {
  recordUiMessage: (name: string) => void;
  recordAppMessage: (name: string) => void;
  recordPlayStage: (
    stage: string,
    payload?: {
      requestId?: string;
      mode?: string;
      title?: string;
      url?: string;
    },
  ) => void;
  recordError: (prefix: string, error: unknown) => void;
  snapshot: () => AppDiagnosticPayload;
}

export interface SidebarSyncService {
  syncState: () => void;
  syncDiagnostic: () => void;
  syncPlayback: () => void;
  postPlayResult: (payload: AppPlayResultPayload) => void;
  syncAll: () => void;
}

export interface PlaybackStateService {
  register: () => void;
  syncNow: () => void;
}

export interface PlaybackService {
  playEpisode: (payload: PlayEpisodeCommand) => void;
  playAll: (payload: PlayAllCommand) => void;
}

export interface IinaSidebar {
  onMessage: (name: string, handler: (payload: any) => void) => void;
  postMessage: (name: string, payload: unknown) => void;
  loadFile: (path: string) => void;
  show: () => void;
  hide: () => void;
}
