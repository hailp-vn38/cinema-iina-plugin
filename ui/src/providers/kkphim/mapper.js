import { KKPHIM_CATEGORIES } from "./constants.js";

function absoluteImageUrl(path, imageBaseUrl) {
  const value = String(path || "").trim();
  if (!value) {
    return "";
  }

  if (/^https?:\/\//.test(value)) {
    return value;
  }

  const base = String(imageBaseUrl || "https://phimimg.com").replace(/\/+$/, "");
  return base + "/" + value.replace(/^\/+/, "");
}

function normalizeMovie(item, imageBaseUrl) {
  return {
    sourceId: "kkphim",
    id:
      item && (item._id || item.slug || item.name)
        ? item._id || item.slug || item.name
        : "",
    slug: item && item.slug ? item.slug : "",
    name: item && item.name ? item.name : "Unknown title",
    originName: item && item.origin_name ? item.origin_name : "",
    posterUrl: absoluteImageUrl(
      item && (item.thumb_url || item.poster_url)
        ? item.thumb_url || item.poster_url
        : "",
      imageBaseUrl,
    ),
    year: item && item.year ? String(item.year) : "",
    quality: item && item.quality ? String(item.quality) : "",
    lang: item && item.lang ? String(item.lang) : "",
    episodeCurrent:
      item && item.episode_current ? String(item.episode_current) : "",
    type: item && item.type ? String(item.type) : "",
  };
}

function buildPlayEntries(serverData) {
  return (serverData || [])
    .filter((episode) => episode && episode.link_m3u8)
    .map((episode) => ({
      name: episode.name ? String(episode.name) : "",
      slug: episode.slug ? String(episode.slug) : "",
      url: String(episode.link_m3u8),
    }));
}

function normalizeServers(episodes) {
  return (episodes || [])
    .map((server, index) => {
      const entries = buildPlayEntries(
        server && server.server_data ? server.server_data : [],
      );
      return {
        id: "kkphim-server-" + index,
        index,
        name:
          server && server.server_name
            ? String(server.server_name)
            : "Server " + (index + 1),
        entries,
      };
    })
    .filter((server) => server.entries.length > 0);
}

function pickActiveServerIndex(servers) {
  const vietsubIndex = servers.findIndex((server) =>
    String(server && server.name ? server.name : "")
      .toLowerCase()
      .includes("vietsub"),
  );

  return vietsubIndex >= 0 ? vietsubIndex : 0;
}

function paginationFrom(paramsPagination, fallback = {}) {
  return {
    currentPage: paramsPagination && paramsPagination.currentPage ? paramsPagination.currentPage : fallback.currentPage || 1,
    totalPages: paramsPagination && paramsPagination.totalPages ? paramsPagination.totalPages : fallback.totalPages || 1,
    totalItems: paramsPagination && paramsPagination.totalItems ? paramsPagination.totalItems : fallback.totalItems || 0,
  };
}

export function mapHomePayload(payload) {
  const items = Array.isArray(payload && payload.items) ? payload.items : [];
  const pagination = payload && payload.pagination ? payload.pagination : {};
  return {
    mode: "home",
    title: "Trang chủ",
    subtitle: "Phim mới cập nhật",
    keyword: "",
    items: items.map((item) => normalizeMovie(item, "https://phimimg.com")),
    categories: KKPHIM_CATEGORIES,
    activeCategory: "phim-bo",
    pagination: {
      currentPage: pagination.currentPage || 1,
      totalPages: pagination.totalPages || 1,
      totalItems: pagination.totalItems || 0,
    },
  };
}

export function mapCategoryPayload(slug, payload) {
  const data = payload && payload.data ? payload.data : {};
  const paramsPagination = data && data.params ? data.params.pagination : {};
  return {
    mode: "category",
    title: data.titlePage || slug,
    subtitle: "Danh sách phim",
    keyword: "",
    items: (data.items || []).map((item) =>
      normalizeMovie(item, data.APP_DOMAIN_CDN_IMAGE || "https://phimimg.com"),
    ),
    categories: KKPHIM_CATEGORIES,
    activeCategory: slug,
    pagination: paginationFrom(paramsPagination),
  };
}

export function mapSearchPayload(keyword, payload) {
  const data = payload && payload.data ? payload.data : {};
  const paramsPagination = data && data.params ? data.params.pagination : {};
  return {
    mode: "search",
    title: "Tìm kiếm",
    subtitle: 'Kết quả cho "' + keyword + '"',
    keyword,
    items: (data.items || []).map((item) =>
      normalizeMovie(item, data.APP_DOMAIN_CDN_IMAGE || "https://phimimg.com"),
    ),
    categories: KKPHIM_CATEGORIES,
    activeCategory: "",
    pagination: paginationFrom(paramsPagination),
  };
}

export function mapDetailPayload(slug, payload) {
  const movie = payload && payload.movie ? payload.movie : null;
  const servers = normalizeServers(payload && payload.episodes ? payload.episodes : []);
  const activeServerIndex = pickActiveServerIndex(servers);
  const activeServer = servers[activeServerIndex] || null;

  return {
    sourceId: "kkphim",
    movieId:
      movie && (movie._id || movie.slug || movie.name)
        ? String(movie._id || movie.slug || movie.name)
        : String(slug || ""),
    slug: String(slug || (movie && movie.slug) || ""),
    title: movie && movie.name ? String(movie.name) : String(slug || "Movie"),
    originName: movie && movie.origin_name ? String(movie.origin_name) : "",
    posterUrl: absoluteImageUrl(
      movie && (movie.thumb_url || movie.poster_url)
        ? movie.thumb_url || movie.poster_url
        : "",
      "https://phimimg.com",
    ),
    content:
      movie && movie.content
        ? String(movie.content).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
        : "",
    quality: movie && movie.quality ? String(movie.quality) : "",
    lang: movie && movie.lang ? String(movie.lang) : "",
    year: movie && movie.year ? String(movie.year) : "",
    time: movie && movie.time ? String(movie.time) : "",
    episodeCurrent: movie && movie.episode_current ? String(movie.episode_current) : "",
    serverName: activeServer ? activeServer.name : "",
    activeServerIndex,
    servers,
    entries: activeServer ? activeServer.entries : [],
  };
}
