export const UI_COMMANDS = {
  INIT: "ui_init",
  PLAY_EPISODE: "play_episode",
  PLAY_ALL: "play_all",
  REQUEST_DIAGNOSTIC: "request_diagnostic",
};

export function isUiCommand(value) {
  return Object.values(UI_COMMANDS).includes(value);
}
