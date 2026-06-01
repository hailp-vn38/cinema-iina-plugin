export const UI_COMMANDS = {
  INIT: "ui_init",
  PLAY_EPISODE: "play_episode",
  PLAY_ALL: "play_all",
  REQUEST_DIAGNOSTIC: "request_diagnostic",
  REQUEST_RUNTIME_SYNC: "request_runtime_sync",
} as const;

export type UiCommandName = (typeof UI_COMMANDS)[keyof typeof UI_COMMANDS];

export function isUiCommand(value: string): value is UiCommandName {
  return Object.values(UI_COMMANDS).includes(value as UiCommandName);
}
