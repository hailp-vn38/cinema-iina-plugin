import { UI_COMMANDS } from "./contracts/commands";
import { RUNTIME_EVENTS } from "./contracts/events";

export const PLUGIN_METADATA = {
  name: "Cinema Sources",
  version: "0.2.0-dev.0",
  sidebarTabName: "Cinema",
} as const;

export const DEFAULT_PROVIDER_ENDPOINTS = {
  ophimApiBase: "https://ophim1.com/v1/api",
  kkphimApiBase: "https://phimapi.com",
} as const;

export const CONTRACTS = {
  commands: UI_COMMANDS,
  events: RUNTIME_EVENTS,
} as const;
