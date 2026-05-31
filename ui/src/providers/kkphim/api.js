import { KKPHIM_API_BASE } from "./constants.js";

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

export const kkphimApi = {
  getHome(page = 1) {
    return fetchJson(
      KKPHIM_API_BASE +
        "/danh-sach/phim-moi-cap-nhat?page=" +
        encodeURIComponent(page),
    );
  },
  getCategory(slug, page = 1) {
    return fetchJson(
      KKPHIM_API_BASE +
        "/v1/api/danh-sach/" +
        encodeURIComponent(slug) +
        "?page=" +
        encodeURIComponent(page),
    );
  },
  search(keyword, page = 1) {
    return fetchJson(
      KKPHIM_API_BASE +
        "/v1/api/tim-kiem?keyword=" +
        encodeURIComponent(keyword) +
        "&page=" +
        encodeURIComponent(page),
    );
  },
  getDetail(slug) {
    return fetchJson(KKPHIM_API_BASE + "/phim/" + encodeURIComponent(slug));
  },
};
