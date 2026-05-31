export const RUNTIME_EVENTS = {
  APP_STATE: "app_state",
  APP_PLAY_RESULT: "app_play_result",
  APP_PLAYBACK_STATE: "app_playback_state",
  APP_DIAGNOSTIC: "app_diagnostic",
};

export function isRuntimeEvent(value) {
  return Object.values(RUNTIME_EVENTS).includes(value);
}
