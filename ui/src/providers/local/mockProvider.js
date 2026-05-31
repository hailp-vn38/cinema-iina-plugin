import { createBaseProvider } from "../baseProvider.js";

export const mockProvider = createBaseProvider({
  id: "mock",
  label: "Mock",
  categories: [{ slug: "mock-home", label: "Mock" }],
  supports: {
    home: true,
    search: true,
    categories: true,
    servers: true,
  },
  async getHome() {
    return {
      mode: "home",
      title: "Mock Home",
      subtitle: "Dữ liệu giả lập cho Phase 5",
      keyword: "",
      categories: [{ slug: "mock-home", label: "Mock" }],
      activeCategory: "mock-home",
      items: [
        {
          sourceId: "mock",
          id: "mock-1",
          slug: "mock-1",
          name: "Mock Movie One",
          originName: "Prototype A",
          posterUrl: "",
          year: "2026",
          quality: "HD",
          lang: "Demo",
          episodeCurrent: "Trailer",
          type: "mock",
        },
        {
          sourceId: "mock",
          id: "mock-2",
          slug: "mock-2",
          name: "Mock Movie Two",
          originName: "Prototype B",
          posterUrl: "",
          year: "2026",
          quality: "4K",
          lang: "Demo",
          episodeCurrent: "Full",
          type: "mock",
        },
      ],
    };
  },
  async getCategory() {
    return this.getHome();
  },
  async search(keyword) {
    const home = await this.getHome();
    return Object.assign({}, home, {
      mode: "search",
      title: "Mock Search",
      subtitle: 'Keyword: "' + keyword + '"',
      keyword: keyword,
    });
  },
  async getDetail(slug) {
    return {
      sourceId: "mock",
      movieId: slug || "mock-1",
      slug: slug || "mock-1",
      title: slug === "mock-2" ? "Mock Movie Two" : "Mock Movie One",
      originName: slug === "mock-2" ? "Prototype B" : "Prototype A",
      posterUrl: "",
      content: "Mock detail view for UI development.",
      quality: "HD",
      lang: "Demo",
      year: "2026",
      time: "24 phút",
      episodeCurrent: "Tập 2",
      serverName: "Mock Server",
      activeServerIndex: 0,
      servers: [
        {
          id: "mock-server-1",
          name: "Mock Server",
          entries: [
            {
              name: "1",
              slug: "1",
              url: "https://example.com/mock-episode-1.m3u8",
            },
            {
              name: "2",
              slug: "2",
              url: "https://example.com/mock-episode-2.m3u8",
            },
          ],
        },
      ],
      entries: [
        {
          name: "1",
          slug: "1",
          url: "https://example.com/mock-episode-1.m3u8",
        },
        {
          name: "2",
          slug: "2",
          url: "https://example.com/mock-episode-2.m3u8",
        },
      ],
    };
  },
  toPlaybackPayload(detail, options = {}) {
    if (!detail || !Array.isArray(detail.entries) || !detail.entries.length) {
      throw new Error("Mock source has no playable entries.");
    }

    if (options.mode === "all") {
      return {
        sourceId: "mock",
        movieId: detail.movieId,
        detailSlug: detail.slug,
        title: detail.title,
        serverId: "mock-server-1",
        startEpisodeIndex:
          typeof options.startEpisodeIndex === "number"
            ? options.startEpisodeIndex
            : 0,
        entries: detail.entries,
      };
    }

    const episodeIndex =
      typeof options.episodeIndex === "number" ? options.episodeIndex : 0;
    return {
      sourceId: "mock",
      movieId: detail.movieId,
      detailSlug: detail.slug,
      title: detail.title,
      serverId: "mock-server-1",
      episodeIndex,
      episodeName:
        detail.entries[episodeIndex] && detail.entries[episodeIndex].name
          ? detail.entries[episodeIndex].name
          : "",
      entries: detail.entries,
    };
  },
});
