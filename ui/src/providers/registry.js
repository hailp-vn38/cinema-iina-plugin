import { kkphimProvider } from "./kkphim/index.js";
import { ophimProvider } from "./ophim/index.js";

const providers = {
  ophim: ophimProvider,
  kkphim: kkphimProvider,
};

export function getProvider(sourceId) {
  return providers[sourceId] || null;
}

export function listProviders() {
  return Object.values(providers);
}
