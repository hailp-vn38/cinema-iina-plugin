import { UI_COMMANDS } from "./contracts/commands";
import { RUNTIME_EVENTS } from "./contracts/events";

export const PLUGIN_METADATA = {
  name: "Cinema Sources",
  version: "0.1.0",
  sidebarTabName: "Cinema",
} as const;

export const DEFAULT_PROVIDER_ENDPOINTS = {
  ophimApiBase: "https://ophim1.com/v1/api",
  kkphimApiBase: "https://phimapi.com",
} as const;

export const PLAY_HANDOFF_PATH = "@tmp/cinema-sources-pending-play.json";
export const PLAY_HANDOFF_MAX_AGE_MS = 120000;

export const CONTRACTS = {
  commands: UI_COMMANDS,
  events: RUNTIME_EVENTS,
} as const;
