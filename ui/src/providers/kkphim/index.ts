import type {
  PlayAllCommand,
  PlayEpisodeCommand,
  ProviderDetail,
} from "@shared/contracts/models";
import { createBaseProvider } from "../baseProvider";
import type { PlaybackPayloadOptions } from "../types";
import { kkphimApi } from "./api";
import { KKPHIM_CATEGORIES } from "./constants";
import {
  mapCategoryPayload,
  mapDetailPayload,
  mapHomePayload,
  mapSearchPayload,
} from "./mapper";

export const kkphimProvider = createBaseProvider({
  id: "kkphim",
  label: "KKPhim",
  categories: KKPHIM_CATEGORIES,
  supports: {
    home: true,
    search: true,
    categories: true,
    servers: true,
  },
  async getHome(page = 1) {
    const payload = await kkphimApi.getHome(page);
    return mapHomePayload(payload);
  },
  async getCategory(slug: string, page = 1) {
    const payload = await kkphimApi.getCategory(slug, page);
    return mapCategoryPayload(slug, payload);
  },
  async search(keyword: string, page = 1) {
    const payload = await kkphimApi.search(keyword, page);
    return mapSearchPayload(keyword, payload);
  },
  async getDetail(slug: string) {
    const payload = await kkphimApi.getDetail(slug);
    const detail = mapDetailPayload(slug, payload);
    if (!detail.entries.length) {
      throw new Error("Không có link m3u8 hợp lệ.");
    }
    return detail;
  },
  toPlaybackPayload(
    detail: ProviderDetail,
    options: PlaybackPayloadOptions = { mode: "single" },
  ): PlayEpisodeCommand | PlayAllCommand {
    const serverIndex =
      typeof options.serverIndex === "number"
        ? options.serverIndex
        : typeof detail.activeServerIndex === "number"
          ? detail.activeServerIndex
          : 0;
    const servers = Array.isArray(detail.servers) ? detail.servers : [];
    const server = servers[serverIndex] || null;
    const entries = server && Array.isArray(server.entries) ? server.entries : [];

    if (!entries.length) {
      throw new Error("Không có link phát hợp lệ.");
    }

    if (options.mode === "all") {
      return {
        requestId: "",
        sourceId: detail.sourceId || "kkphim",
        movieId: detail.movieId || detail.slug || "",
        detailSlug: detail.slug || "",
        title: detail.title || "Movie",
        serverId: server ? server.id : "",
        startEpisodeIndex:
          typeof options.startEpisodeIndex === "number"
            ? options.startEpisodeIndex
            : 0,
        entries,
      };
    }

    const episodeIndex =
      typeof options.episodeIndex === "number" ? options.episodeIndex : 0;
    const entry = entries[episodeIndex] || entries[0];
    return {
      requestId: "",
      sourceId: detail.sourceId || "kkphim",
      movieId: detail.movieId || detail.slug || "",
      detailSlug: detail.slug || "",
      title: detail.title || "Movie",
      serverId: server ? server.id : "",
      episodeIndex,
      episodeName: entry && entry.name ? entry.name : "",
      entries,
    };
  },
});
