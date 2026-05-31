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
};

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
};
