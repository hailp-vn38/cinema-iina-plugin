import type { UiCommandName } from "@shared/contracts/commands";
import { UI_COMMANDS } from "@shared/contracts/commands";
import type { RuntimeEventName } from "@shared/contracts/events";
import { RUNTIME_EVENTS } from "@shared/contracts/events";

type BridgePayload = Record<string, unknown>;
type BridgeHandler = (payload: unknown) => void;

interface IinaBridge {
  postMessage: (name: string, payload?: unknown) => void;
  onMessage: (name: string, handler: BridgeHandler) => void;
}

function getIinaBridge(): IinaBridge {
  if (typeof window !== "undefined" && window.iina) {
    return window.iina;
  }

  return {
    postMessage(name: string, payload?: unknown) {
      console.debug("[mock-iina] postMessage", name, payload);
    },
    onMessage(name: string, handler: BridgeHandler) {
      console.debug("[mock-iina] onMessage", name, handler);
    },
  };
}

export const iinaClient = {
  commands: UI_COMMANDS,
  events: RUNTIME_EVENTS,
  post(command: UiCommandName, payload: BridgePayload = {}) {
    getIinaBridge().postMessage(command, payload);
  },
  on(event: RuntimeEventName, handler: BridgeHandler) {
    getIinaBridge().onMessage(event, handler);
  },
};
