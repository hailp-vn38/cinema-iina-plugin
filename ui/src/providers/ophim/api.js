import { OPHIM_API_BASE } from "./constants.js";

async function fetchJson(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("HTTP " + response.status);
  }

  return response.json();
}

export const ophimApi = {
  getHome() {
    return fetchJson(OPHIM_API_BASE + "/home");
  },
  getCategory(slug, page = 1) {
    return fetchJson(
      OPHIM_API_BASE +
        "/danh-sach/" +
        encodeURIComponent(slug) +
        "?page=" +
        page +
        "&limit=24",
    );
  },
  search(keyword) {
    return fetchJson(
      OPHIM_API_BASE + "/tim-kiem?keyword=" + encodeURIComponent(keyword),
    );
  },
  getDetail(slug) {
    return fetchJson(OPHIM_API_BASE + "/phim/" + encodeURIComponent(slug));
  },
};
