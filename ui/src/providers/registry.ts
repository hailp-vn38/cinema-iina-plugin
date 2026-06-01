import type { SourceProvider } from "./types";
import { kkphimProvider } from "./kkphim";
import { ophimProvider } from "./ophim";

const providers: Record<string, SourceProvider> = {
  ophim: ophimProvider,
  kkphim: kkphimProvider,
};

export function getProvider(sourceId: string): SourceProvider | null {
  return providers[sourceId] || null;
}

export function listProviders(): SourceProvider[] {
  return Object.values(providers);
}
