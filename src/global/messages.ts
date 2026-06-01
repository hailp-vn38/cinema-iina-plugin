export const GLOBAL_MESSAGES = {
  OPEN_WINDOW: "global_open_window",
  PLAYER_READY: "global_player_ready",
  PLAYER_WINDOW_LOADED: "global_player_window_loaded",
  PLAYER_CLOSED: "global_player_closed",
  PLAYER_APP_STATE: "global_player_app_state",
  PLAYER_PLAY_RESULT: "global_player_play_result",
  PLAYER_PLAYBACK_STATE: "global_player_playback_state",
  PLAYER_WINDOW_VISIBLE: "global_player_window_visible",
  PLAYER_BOOTSTRAP_EPISODE: "global_player_bootstrap_episode",
  PLAYER_BOOTSTRAP_PLAYLIST: "global_player_bootstrap_playlist",
  PLAYER_PLAY_EPISODE: "global_player_play_episode",
  PLAYER_PLAY_ALL: "global_player_play_all",
} as const;

export type GlobalMessageName =
  (typeof GLOBAL_MESSAGES)[keyof typeof GLOBAL_MESSAGES];
