import { PLUGIN_METADATA } from "../../shared/constants";
import type { DiagnosticService, RuntimeStore } from "../types";

export function createDiagnosticService({
  runtimeStore,
  console,
}: {
  runtimeStore: RuntimeStore;
  console: Console;
}): DiagnosticService {
  runtimeStore.diagnostic.pluginVersion = PLUGIN_METADATA.version;

  return {
    recordUiMessage(name) {
      runtimeStore.setLastUiMessage(name);
    },
    recordAppMessage(name) {
      runtimeStore.setLastAppMessage(name);
    },
    recordPlayStage(stage, payload) {
      runtimeStore.setPlayStage(stage);
      if (payload) {
        runtimeStore.setPlayPayloadMeta(payload);
      }
    },
    recordError(prefix, error) {
      const message =
        error instanceof Error ? error.message : String(error);
      runtimeStore.setLastError(prefix + ": " + message);
      console.log(prefix + ": " + message);
    },
    snapshot() {
      return { ...runtimeStore.diagnostic };
    },
  };
}
