import { UI_COMMANDS } from "@shared/contracts/commands.js";
import { RUNTIME_EVENTS } from "@shared/contracts/events.js";

function getIinaBridge() {
  if (typeof window !== "undefined" && window.iina) {
    return window.iina;
  }

  return {
    postMessage(name, payload) {
      console.debug("[mock-iina] postMessage", name, payload);
    },
    onMessage(name, handler) {
      console.debug("[mock-iina] onMessage", name, handler);
    },
  };
}

export const iinaClient = {
  commands: UI_COMMANDS,
  events: RUNTIME_EVENTS,
  post(command, payload = {}) {
    getIinaBridge().postMessage(command, payload);
  },
  on(event, handler) {
    getIinaBridge().onMessage(event, handler);
  },
};
