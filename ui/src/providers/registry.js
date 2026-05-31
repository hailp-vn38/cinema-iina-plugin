import { mockProvider } from "./local/mockProvider.js";
import { ophimProvider } from "./ophim/index.js";

const providers = {
  ophim: ophimProvider,
  mock: mockProvider,
};

export function getProvider(sourceId) {
  return providers[sourceId] || null;
}

export function listProviders() {
  return Object.values(providers);
}
