import { createBaseProvider } from "../baseProvider.js";
import { ophimApi } from "./api.js";
import { mapCategoryPayload, mapHomePayload, mapSearchPayload } from "./mapper.js";

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
  async getCategory(slug) {
    const payload = await ophimApi.getCategory(slug);
    return mapCategoryPayload(slug, payload);
  },
  async search(keyword) {
    const payload = await ophimApi.search(keyword);
    return mapSearchPayload(keyword, payload);
  },
  async getDetail(slug) {
    return ophimApi.getDetail(slug);
  },
  toPlaybackPayload() {
    throw new Error("Playback payload mapping is not implemented in Phase 5.");
  },
});
