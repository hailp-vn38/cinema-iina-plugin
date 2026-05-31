import { OPHIM_CATEGORIES } from "./constants.js";

function normalizeImageBase(imageBaseUrl) {
  const normalizedBase = String(imageBaseUrl || "").replace(/\/+$/, "");
  if (!normalizedBase) {
    return "https://img.ophim.live/uploads/movies";
  }

  if (normalizedBase.includes("/uploads/movies")) {
    return normalizedBase;
  }

  return normalizedBase + "/uploads/movies";
}

function absoluteImageUrl(path, imageBaseUrl) {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return (
    normalizeImageBase(imageBaseUrl) + "/" + String(path).replace(/^\/+/, "")
  );
}

function normalizeMovie(item, imageBaseUrl) {
  return {
    sourceId: "ophim",
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
        id: "ophim-server-" + index,
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

export function mapHomePayload(payload) {
  const data = payload && payload.data ? payload.data : {};
  return {
    mode: "home",
    title: "Trang chủ",
    subtitle: "Phim mới cập nhật",
    keyword: "",
    items: (data.items || []).map((item) =>
      normalizeMovie(item, data.APP_DOMAIN_CDN_IMAGE),
    ),
    categories: OPHIM_CATEGORIES,
    activeCategory: "phim-moi",
    pagination: {
      currentPage: 1,
      totalPages: 999,
      totalItems: 0,
    },
  };
}

export function mapCategoryPayload(slug, payload) {
  const data = payload && payload.data ? payload.data : {};
  const pagination = payload && payload.pagination ? payload.pagination : {};
  return {
    mode: "category",
    title: data.titlePage || slug,
    subtitle: "Danh sách phim",
    keyword: "",
    items: (data.items || []).map((item) =>
      normalizeMovie(item, data.APP_DOMAIN_CDN_IMAGE),
    ),
    categories: OPHIM_CATEGORIES,
    activeCategory: slug,
    pagination: {
      currentPage: pagination.currentPage || 1,
      totalPages: pagination.totalPage || 1,
      totalItems: pagination.totalItems || 0,
    },
  };
}

export function mapSearchPayload(keyword, payload) {
  const data = payload && payload.data ? payload.data : {};
  return {
    mode: "search",
    title: "Tìm kiếm",
    subtitle: 'Kết quả cho "' + keyword + '"',
    keyword,
    items: (data.items || []).map((item) =>
      normalizeMovie(item, data.APP_DOMAIN_CDN_IMAGE),
    ),
    categories: OPHIM_CATEGORIES,
    activeCategory: "",
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: Array.isArray(data.items) ? data.items.length : 0,
    },
  };
}

export function mapDetailPayload(slug, payload) {
  const data = payload && payload.data ? payload.data : {};
  const item = data && data.item ? data.item : null;
  const servers = normalizeServers(item && item.episodes ? item.episodes : []);
  const activeServerIndex = pickActiveServerIndex(servers);
  const activeServer = servers[activeServerIndex] || null;

  return {
    sourceId: "ophim",
    movieId:
      item && (item._id || item.slug || item.name)
        ? String(item._id || item.slug || item.name)
        : String(slug || ""),
    slug: String(slug || (item && item.slug) || ""),
    title: item && item.name ? String(item.name) : String(slug || "Movie"),
    originName: item && item.origin_name ? String(item.origin_name) : "",
    posterUrl: absoluteImageUrl(
      item && (item.thumb_url || item.poster_url)
        ? item.thumb_url || item.poster_url
        : "",
      data.APP_DOMAIN_CDN_IMAGE,
    ),
    content:
      item && item.content
        ? String(item.content).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
        : "",
    quality: item && item.quality ? String(item.quality) : "",
    lang: item && item.lang ? String(item.lang) : "",
    year: item && item.year ? String(item.year) : "",
    time: item && item.time ? String(item.time) : "",
    episodeCurrent:
      item && item.episode_current ? String(item.episode_current) : "",
    serverName: activeServer ? activeServer.name : "",
    activeServerIndex,
    servers,
    entries: activeServer ? activeServer.entries : [],
  };
}
