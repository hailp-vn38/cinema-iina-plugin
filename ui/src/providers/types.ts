import type {
  CatalogPayload,
  PlayAllCommand,
  PlayEpisodeCommand,
  ProviderCategory,
  ProviderDetail,
} from "@shared/contracts/models";

export interface ProviderSupports {
  home: boolean;
  search: boolean;
  categories: boolean;
  servers: boolean;
}

export interface PlaybackPayloadOptions {
  mode: "single" | "all";
  episodeIndex?: number;
  startEpisodeIndex?: number;
  serverIndex?: number;
}

export interface SourceProvider {
  id: string;
  label: string;
  categories: ProviderCategory[];
  supports: ProviderSupports;
  getHome: (page?: number) => Promise<CatalogPayload>;
  getCategory: (slug: string, page?: number) => Promise<CatalogPayload>;
  search: (keyword: string, page?: number) => Promise<CatalogPayload>;
  getDetail: (slug: string) => Promise<ProviderDetail>;
  toPlaybackPayload: (
    detail: ProviderDetail,
    options?: PlaybackPayloadOptions,
  ) => PlayEpisodeCommand | PlayAllCommand;
}

export interface SourceProviderDefinition {
  id: string;
  label: string;
  categories?: ProviderCategory[];
  supports?: Partial<ProviderSupports>;
  getHome: (page?: number) => Promise<CatalogPayload>;
  getCategory: (slug: string, page?: number) => Promise<CatalogPayload>;
  search: (keyword: string, page?: number) => Promise<CatalogPayload>;
  getDetail: (slug: string) => Promise<ProviderDetail>;
  toPlaybackPayload: (
    detail: ProviderDetail,
    options?: PlaybackPayloadOptions,
  ) => PlayEpisodeCommand | PlayAllCommand;
}
