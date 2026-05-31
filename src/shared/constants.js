import { UI_COMMANDS } from "./contracts/commands.js";
import { RUNTIME_EVENTS } from "./contracts/events.js";

export const PLUGIN_METADATA = {
  name: "Cinema Sources",
  version: "0.2.0-dev.0",
  sidebarTabName: "Cinema",
};

export const CONTRACTS = {
  commands: UI_COMMANDS,
  events: RUNTIME_EVENTS,
};
