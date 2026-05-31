export function createRuntimeBus(sidebar) {
  return {
    on(name, handler) {
      sidebar.onMessage(name, handler);
    },
    emit(name, payload) {
      sidebar.postMessage(name, payload);
    },
  };
}
