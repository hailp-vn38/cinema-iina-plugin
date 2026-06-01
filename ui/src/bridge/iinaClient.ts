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

interface BridgeDebugInfo {
  source: string;
  hasGlobalIdentifier: boolean;
  hasGlobalThisIina: boolean;
  hasWindowIina: boolean;
}

function isBridge(value: unknown): value is IinaBridge {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as IinaBridge).postMessage === "function" &&
      typeof (value as IinaBridge).onMessage === "function",
  );
}

function getBridgeDebugInfo(): BridgeDebugInfo {
  return {
    source: "mock",
    hasGlobalIdentifier: typeof iina !== "undefined" && isBridge(iina),
    hasGlobalThisIina:
      typeof globalThis !== "undefined" && isBridge((globalThis as any).iina),
    hasWindowIina: typeof window !== "undefined" && isBridge(window.iina),
  };
}

function getIinaBridge(): IinaBridge {
  if (typeof iina !== "undefined" && isBridge(iina)) {
    return iina;
  }

  if (typeof globalThis !== "undefined" && isBridge((globalThis as any).iina)) {
    return (globalThis as any).iina;
  }

  if (typeof window !== "undefined" && isBridge(window.iina)) {
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
  inspect(): BridgeDebugInfo {
    const info = getBridgeDebugInfo();
    if (info.hasGlobalIdentifier) {
      return { ...info, source: "identifier" };
    }
    if (info.hasGlobalThisIina) {
      return { ...info, source: "globalThis.iina" };
    }
    if (info.hasWindowIina) {
      return { ...info, source: "window.iina" };
    }
    return info;
  },
  post(command: UiCommandName, payload: BridgePayload = {}) {
    getIinaBridge().postMessage(command, payload);
  },
  on(event: RuntimeEventName, handler: BridgeHandler) {
    getIinaBridge().onMessage(event, handler);
  },
};
