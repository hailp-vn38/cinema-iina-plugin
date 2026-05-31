import { createBaseProvider } from "../baseProvider.js";
import { ophimApi } from "./api.js";
import {
  mapCategoryPayload,
  mapDetailPayload,
  mapHomePayload,
  mapSearchPayload,
} from "./mapper.js";

export const ophimProvider = createBaseProvider({
  id: "ophim",
  label: "OPhim",
  supports: {
    home: true,
    search: true,
    categories: true,
    servers: true,
  },
  async getHome() {
    const payload = await ophimApi.getHome();
    return mapHomePayload(payload);
  },
  async getCategory(slug, page = 1) {
    const payload = await ophimApi.getCategory(slug, page);
    return mapCategoryPayload(slug, payload);
  },
  async search(keyword) {
    const payload = await ophimApi.search(keyword);
    return mapSearchPayload(keyword, payload);
  },
  async getDetail(slug) {
    const payload = await ophimApi.getDetail(slug);
    const detail = mapDetailPayload(slug, payload);
    if (!detail.entries.length) {
      throw new Error("Không có link m3u8 hợp lệ.");
    }
    return detail;
  },
  toPlaybackPayload(detail, options = {}) {
    const serverIndex =
      typeof options.serverIndex === "number"
        ? options.serverIndex
        : detail && typeof detail.activeServerIndex === "number"
          ? detail.activeServerIndex
          : 0;
    const servers = detail && Array.isArray(detail.servers) ? detail.servers : [];
    const server = servers[serverIndex] || null;
    const entries = server && Array.isArray(server.entries) ? server.entries : [];

    if (!detail || !entries.length) {
      throw new Error("Không có link phát hợp lệ.");
    }

    if (options.mode === "all") {
      return {
        sourceId: detail.sourceId || "ophim",
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
      sourceId: detail.sourceId || "ophim",
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
