export const RUNTIME_EVENTS = {
  APP_STATE: "app_state",
  APP_PLAY_RESULT: "app_play_result",
  APP_PLAYBACK_STATE: "app_playback_state",
  APP_DIAGNOSTIC: "app_diagnostic",
  APP_CONFIG: "app_config",
} as const;

export type RuntimeEventName =
  (typeof RUNTIME_EVENTS)[keyof typeof RUNTIME_EVENTS];

export function isRuntimeEvent(value: string): value is RuntimeEventName {
  return Object.values(RUNTIME_EVENTS).includes(value as RuntimeEventName);
}
