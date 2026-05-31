import { createBaseProvider } from "../baseProvider.js";

export const mockProvider = createBaseProvider({
  id: "mock",
  label: "Mock",
  supports: {
    home: true,
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
  async getDetail() {
    throw new Error("Mock detail is not implemented in Phase 5.");
  },
  toPlaybackPayload() {
    throw new Error("Mock playback mapping is not implemented in Phase 5.");
  },
});
