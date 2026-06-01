import type { AppConfigPayload } from "@shared/contracts/models";
import { DEFAULT_PROVIDER_ENDPOINTS } from "@shared/constants";

let currentProviderConfig: AppConfigPayload = {
  ...DEFAULT_PROVIDER_ENDPOINTS,
};

export function getProviderConfig(): AppConfigPayload {
  return { ...currentProviderConfig };
}

export function setProviderConfig(payload: Partial<AppConfigPayload>): void {
  currentProviderConfig = {
    ophimApiBase:
      String(payload.ophimApiBase || "").trim() ||
      DEFAULT_PROVIDER_ENDPOINTS.ophimApiBase,
    kkphimApiBase:
      String(payload.kkphimApiBase || "").trim() ||
      DEFAULT_PROVIDER_ENDPOINTS.kkphimApiBase,
  };
}
