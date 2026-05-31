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
    keyword: keyword,
    items: (data.items || []).map((item) =>
      normalizeMovie(item, data.APP_DOMAIN_CDN_IMAGE),
    ),
    categories: OPHIM_CATEGORIES,
    activeCategory: "",
  };
}
