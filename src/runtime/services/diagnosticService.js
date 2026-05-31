import { PLUGIN_METADATA } from "../../shared/constants.js";

export function createDiagnosticService({ runtimeStore, console }) {
  runtimeStore.diagnostic.pluginVersion = PLUGIN_METADATA.version;

  return {
    recordUiMessage(name) {
      runtimeStore.setLastUiMessage(name);
    },
    recordAppMessage(name) {
      runtimeStore.setLastAppMessage(name);
    },
    recordError(prefix, error) {
      const message = error && error.message ? error.message : String(error);
      runtimeStore.setLastError(prefix + ": " + message);
      console.log(prefix + ": " + message);
    },
    snapshot() {
      return Object.assign({}, runtimeStore.diagnostic);
    },
  };
}
