import type { IinaSidebar, RuntimeBus } from "../types";

export function createRuntimeBus(sidebar: IinaSidebar): RuntimeBus {
  return {
    on(name, handler) {
      sidebar.onMessage(name, handler);
    },
    emit(name, payload) {
      sidebar.postMessage(name, payload);
    },
  };
}
