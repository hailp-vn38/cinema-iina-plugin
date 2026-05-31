const { console, core, event, http, mpv, sidebar } = iina;

const SIDEBAR_HTML_PATH = "ui/index.html";
const API_BASE_URL = "https://ophim1.com/v1/api";
const DEFAULT_CATEGORY = "phim-moi";
const CATEGORY_OPTIONS = [
  { slug: "phim-moi", label: "Mới" },
  { slug: "phim-bo", label: "Bộ" },
  { slug: "phim-le", label: "Lẻ" },
  { slug: "tv-shows", label: "TV" },
];

let initialized = false;
let lastStatePayload = null;
let lastCatalogPayload = null;
let lastDetailPayload = null;
let lastErrorPayload = null;
let lastPlaybackPayload = null;
let lastDiagnosticPayload = {
  pluginVersion: "0.1.17",
  sidebarLoaded: false,
  windowLoaded: false,
  lastUiMessage: "",
  lastAppMessage: "",
  lastCatalogMode: "",
  lastError: "",
  homeLoadInFlight: false,
};
let homeLoadPromise = null;
let messageHandlersInstalled = false;
let uiInitialized = false;
let currentPlaybackContext = null;

function loadSidebar() {
  if (initialized) {
    return;
  }

  initialized = true;
  console.log("Loading OPhim sidebar");
  sidebar.loadFile(SIDEBAR_HTML_PATH);
  sidebar.show();
  updateDiagnostic({
    sidebarLoaded: true,
    lastAppMessage: "sidebar.loadFile",
  });
}

function syncLatestPayloadsLater() {
  [200, 800, 1600].forEach((delay) => {
    setTimeout(() => {
      if (initialized) {
        syncLatestPayloads();
      }
    }, delay);
  });
}

function runDeferred(task, onError) {
  setTimeout(() => {
    Promise.resolve()
      .then(task)
      .catch((error) => {
        if (onError) {
          onError(error);
          return;
        }

        logError("Deferred task failed", error);
      });
  }, 0);
}

function postState(status, message) {
  lastStatePayload = { status: status, message: message };
  if (initialized) {
    sidebar.postMessage("app_state", lastStatePayload);
  }
  updateDiagnostic({
    lastAppMessage: "app_state",
  });
}

function postCatalog(payload) {
  lastCatalogPayload = payload;
  lastErrorPayload = null;
  if (initialized) {
    sidebar.postMessage("catalog_data", payload);
  }
  updateDiagnostic({
    lastAppMessage: "catalog_data",
    lastCatalogMode: payload && payload.mode ? String(payload.mode) : "",
    lastError: "",
  });
}

function postDetail(payload) {
  lastDetailPayload = payload;
  lastErrorPayload = null;
  if (initialized) {
    sidebar.postMessage("detail_data", payload);
  }
  updateDiagnostic({
    lastAppMessage: "detail_data",
    lastCatalogMode: "detail",
    lastError: "",
  });
}

function postCatalogError(message) {
  lastErrorPayload = { message: message };
  if (initialized) {
    sidebar.postMessage("catalog_error", lastErrorPayload);
  }
  updateDiagnostic({
    lastAppMessage: "catalog_error",
    lastError: String(message || ""),
  });
}

function postPlayback(payload) {
  lastPlaybackPayload = payload;
  if (initialized) {
    sidebar.postMessage("app_playback_state", payload);
  }
  updateDiagnostic({
    lastAppMessage: "app_playback_state",
  });
}

function updateDiagnostic(partial) {
  lastDiagnosticPayload = Object.assign({}, lastDiagnosticPayload, partial || {});
  if (initialized) {
    sidebar.postMessage("app_diagnostic", lastDiagnosticPayload);
  }
}

function syncLatestPayloads() {
  if (lastStatePayload) {
    sidebar.postMessage("app_state", lastStatePayload);
  }

  if (lastCatalogPayload) {
    sidebar.postMessage("catalog_data", lastCatalogPayload);
  }

  if (lastDetailPayload) {
    sidebar.postMessage("detail_data", lastDetailPayload);
  }

  if (lastErrorPayload) {
    sidebar.postMessage("catalog_error", lastErrorPayload);
  }

  if (lastPlaybackPayload) {
    sidebar.postMessage("app_playback_state", lastPlaybackPayload);
  }

  if (lastDiagnosticPayload) {
    sidebar.postMessage("app_diagnostic", lastDiagnosticPayload);
  }
}

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

  const normalizedPath = String(path).replace(/^\/+/, "");
  const normalizedBase = normalizeImageBase(imageBaseUrl);
  return normalizedBase ? normalizedBase + "/" + normalizedPath : normalizedPath;
}

function normalizeMovie(item, imageBaseUrl) {
  return {
    id: item && (item._id || item.slug || item.name) ? item._id || item.slug || item.name : "",
    slug: item && item.slug ? item.slug : "",
    name: item && item.name ? item.name : "Unknown title",
    originName: item && item.origin_name ? item.origin_name : "",
    year: item && item.year ? item.year : "",
    type: item && item.type ? item.type : "",
    quality: item && item.quality ? item.quality : "",
    lang: item && item.lang ? item.lang : "",
    episodeCurrent: item && item.episode_current ? item.episode_current : "",
    posterUrl: absoluteImageUrl(
      item && (item.thumb_url || item.poster_url) ? item.thumb_url || item.poster_url : "",
      imageBaseUrl
    ),
  };
}

async function fetchJson(url) {
  const response = await http.get(url, {
    headers: {
      Accept: "application/json",
    },
  });

  const body = response && typeof response.text === "string" ? response.text : "";
  if (!body) {
    throw new Error("API returned an empty response.");
  }

  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error("API returned invalid JSON.");
  }
}

function logError(prefix, error) {
  const message = error && error.message ? error.message : String(error);
  console.log(prefix + ": " + message);
  updateDiagnostic({
    lastError: prefix + ": " + message,
  });
}

function pickServer(episodes) {
  if (!Array.isArray(episodes) || !episodes.length) {
    return null;
  }

  const vietsubServer = episodes.find((server) =>
    String(server && server.server_name ? server.server_name : "")
      .toLowerCase()
      .includes("vietsub")
  );

  return vietsubServer || episodes[0];
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

async function fetchMovieDetail(slug) {
  const payload = await fetchJson(API_BASE_URL + "/phim/" + encodeURIComponent(slug));
  return payload && payload.data && payload.data.item ? payload.data.item : null;
}

function normalizeDetail(slug, item) {
  const posterBase = "https://img.ophim.live";
  const server = pickServer(item && item.episodes ? item.episodes : []);
  const entries = buildPlayEntries(server && server.server_data ? server.server_data : []);

  return {
    slug: String(slug || ""),
    title: item && item.name ? String(item.name) : String(slug || "Movie"),
    originName: item && item.origin_name ? String(item.origin_name) : "",
    posterUrl: absoluteImageUrl(
      item && (item.thumb_url || item.poster_url) ? item.thumb_url || item.poster_url : "",
      posterBase
    ),
    content: item && item.content ? String(item.content).replace(/<[^>]+>/g, " ").trim() : "",
    quality: item && item.quality ? String(item.quality) : "",
    lang: item && item.lang ? String(item.lang) : "",
    year: item && item.year ? String(item.year) : "",
    time: item && item.time ? String(item.time) : "",
    episodeCurrent: item && item.episode_current ? String(item.episode_current) : "",
    serverName: server && server.server_name ? String(server.server_name) : "",
    entries: entries,
  };
}

function setCurrentMediaTitle(title, episodeName) {
  const parts = [title, episodeName].filter(Boolean);
  if (!parts.length) {
    return;
  }

  mpv.set("force-media-title", parts.join(" - "));
}

function syncPlaybackStateFromContext() {
  if (!currentPlaybackContext) {
    postPlayback({
      active: false,
      title: core.status.title || "",
      episodeName: "",
      episodeIndex: -1,
      detailSlug: "",
      url: core.status.url || "",
    });
    return;
  }

  let episodeIndex = mpv.getNumber("playlist-pos");
  if (typeof episodeIndex !== "number" || Number.isNaN(episodeIndex) || episodeIndex < 0) {
    episodeIndex = currentPlaybackContext.startIndex || 0;
  }

  if (episodeIndex >= currentPlaybackContext.playlistToOriginalIndexes.length) {
    episodeIndex = 0;
  }

  const originalIndex = currentPlaybackContext.playlistToOriginalIndexes[episodeIndex];
  const entry = currentPlaybackContext.allEntries[originalIndex] || null;
  postPlayback({
    active: true,
    title: currentPlaybackContext.title,
    episodeName: entry && entry.name ? entry.name : "",
    episodeIndex: typeof originalIndex === "number" ? originalIndex : -1,
    detailSlug: currentPlaybackContext.detailSlug,
    url: core.status.url || (entry ? entry.url : ""),
  });
}

function loadEntriesIntoMpv(title, entries, startIndex, appendRest) {
  const safeStartIndex =
    typeof startIndex === "number" && startIndex >= 0 && startIndex < entries.length
      ? startIndex
      : 0;
  const primaryEntry = entries[safeStartIndex];

  if (!primaryEntry || !primaryEntry.url) {
    throw new Error("Không có link phát hợp lệ.");
  }

  setCurrentMediaTitle(title, primaryEntry.name);
  mpv.command("loadfile", [primaryEntry.url, "replace"]);

  const playlistToOriginalIndexes = [safeStartIndex];

  if (appendRest) {
    for (let index = 0; index < entries.length; index += 1) {
      if (index === safeStartIndex) {
        continue;
      }
      mpv.command("loadfile", [entries[index].url, "append"]);
      playlistToOriginalIndexes.push(index);
    }
  }

  currentPlaybackContext = {
    title: title,
    detailSlug: "",
    allEntries: entries.slice(),
    playlistToOriginalIndexes: playlistToOriginalIndexes,
    startIndex: safeStartIndex,
  };
}

async function loadHomeCatalog() {
  postState("loading", "Đang tải phim mới...");

  const payload = await fetchJson(API_BASE_URL + "/home");
  const data = payload && payload.data ? payload.data : {};
  const items = (data.items || []).map((item) => normalizeMovie(item, data.APP_DOMAIN_CDN_IMAGE));

  postCatalog({
    mode: "home",
    title: "Trang chủ",
    subtitle: "Phim mới cập nhật",
    items: items,
    categories: CATEGORY_OPTIONS,
    activeCategory: DEFAULT_CATEGORY,
  });

  postState("ready", "Đã tải " + items.length + " phim.");
}

async function loadCategoryCatalog(slug) {
  const categorySlug = String(slug || DEFAULT_CATEGORY);
  postState("loading", "Đang tải danh sách...");

  const url =
    API_BASE_URL + "/danh-sach/" + encodeURIComponent(categorySlug) + "?page=1&limit=24";
  const payload = await fetchJson(url);
  const data = payload && payload.data ? payload.data : {};
  const imageBaseUrl = data.APP_DOMAIN_CDN_IMAGE || "https://img.ophim.cc/uploads/movies";
  const items = (data.items || []).map((item) => normalizeMovie(item, imageBaseUrl));

  postCatalog({
    mode: "category",
    title: data.titlePage || categorySlug,
    subtitle: "Danh sách phim",
    items: items,
    categories: CATEGORY_OPTIONS,
    activeCategory: categorySlug,
  });

  postState("ready", "Đã tải " + items.length + " phim.");
}

async function searchCatalog(keyword) {
  const trimmedKeyword = String(keyword || "").trim();
  if (!trimmedKeyword) {
    return loadHomeCatalog();
  }

  postState("loading", "Đang tìm kiếm...");

  const url = API_BASE_URL + "/tim-kiem?keyword=" + encodeURIComponent(trimmedKeyword);
  const payload = await fetchJson(url);
  const data = payload && payload.data ? payload.data : {};
  const items = (data.items || []).map((item) =>
    normalizeMovie(item, data.APP_DOMAIN_CDN_IMAGE)
  );

  postCatalog({
    mode: "search",
    title: "Tìm kiếm",
    subtitle: 'Kết quả cho "' + trimmedKeyword + '"',
    items: items,
    categories: CATEGORY_OPTIONS,
    activeCategory: "",
  });

  postState("ready", "Tìm thấy " + items.length + " phim.");
}

async function loadDetail(slug) {
  const trimmedSlug = String(slug || "").trim();
  if (!trimmedSlug) {
    throw new Error("Thiếu slug phim.");
  }

  postState("loading", "Đang lấy thông tin phim...");
  const item = await fetchMovieDetail(trimmedSlug);
  if (!item) {
    throw new Error("Không lấy được chi tiết phim.");
  }

  const detail = normalizeDetail(trimmedSlug, item);
  if (!detail.entries.length) {
    throw new Error("Không có link m3u8 hợp lệ.");
  }

  postDetail(detail);
  postState("ready", "Đã tải " + detail.entries.length + " tập.");
}

async function resolvePlayRequest(payload) {
  const directEntries = Array.isArray(payload.entries) ? payload.entries : [];
  const directTitle = String(payload.title || "Movie");
  const playMode = payload && payload.playMode ? String(payload.playMode) : "single";
  const episodeIndex =
    payload && typeof payload.episodeIndex === "number" ? payload.episodeIndex : 0;

  if (directEntries.length) {
    return {
      title: directTitle,
      detailSlug: String(payload.detailSlug || ""),
      entries: directEntries
        .filter((entry) => entry && entry.url)
        .map((entry) => ({
          name: entry.name ? String(entry.name) : "",
          slug: entry.slug ? String(entry.slug) : "",
          url: String(entry.url),
        })),
      playMode: playMode,
      episodeIndex: episodeIndex,
    };
  }

  const slug = String(payload.slug || "").trim();
  if (!slug) {
    throw new Error("Thiếu slug phim.");
  }

  postState("loading", "Đang lấy thông tin phim...");
  const item = await fetchMovieDetail(slug);
  if (!item) {
    throw new Error("Không lấy được chi tiết phim.");
  }

  postState("loading", "Đang chọn server phát...");
  const detail = normalizeDetail(slug, item);
  if (!detail.entries.length) {
    throw new Error("Không có link m3u8 hợp lệ.");
  }

  return {
    title: detail.title,
    detailSlug: slug,
    entries: detail.entries,
    playMode: playMode,
    episodeIndex: episodeIndex,
  };
}

async function playEntries(payload) {
  const requestId = String(payload.requestId || "");

  if (requestId && initialized) {
    sidebar.postMessage("app_play_ack", { requestId: requestId });
  }
  updateDiagnostic({
    lastAppMessage: "app_play_ack",
  });

  const resolved = await resolvePlayRequest(payload);
  const title = resolved.title;
  const detailSlug = resolved.detailSlug;
  const entries = resolved.entries;
  const playMode = resolved.playMode;
  const episodeIndex = resolved.episodeIndex;

  if (!entries.length) {
    throw new Error("Không có link phát hợp lệ.");
  }

  postState("loading", playMode === "all" ? "Đang thêm playlist..." : "Đang mở nguồn phát...");
  updateDiagnostic({
    lastAppMessage: "mpv.command(loadfile)",
  });

  if (playMode === "all") {
    loadEntriesIntoMpv(title, entries, 0, true);
    currentPlaybackContext.detailSlug = detailSlug;
    syncPlaybackStateFromContext();
    postState("ready", "Đang phát tập đầu và đã thêm " + entries.length + " tập vào playlist.");
  } else {
    loadEntriesIntoMpv(title, entries, episodeIndex, false);
    currentPlaybackContext.detailSlug = detailSlug;
    syncPlaybackStateFromContext();
    const currentEntry = entries[episodeIndex] || entries[0];
    const label = currentEntry && currentEntry.name ? currentEntry.name : "nguồn phát";
    postState("ready", "Đang phát: " + label);
  }

  if (requestId && initialized) {
    sidebar.postMessage("app_play_result", {
      requestId: requestId,
      ok: true,
      mode: playMode === "all" ? "playlist" : "single",
      count: entries.length,
    });
  }
  updateDiagnostic({
    lastAppMessage: "app_play_result",
  });
}

function postPlayFailure(payload, error) {
  const requestId = payload && payload.requestId ? String(payload.requestId) : "";
  postState("error", "Không phát được phim.");

  if (requestId && initialized) {
    sidebar.postMessage("app_play_result", {
      requestId: requestId,
      ok: false,
      error: error && error.message ? error.message : "Unknown error",
    });
  }
  updateDiagnostic({
    lastAppMessage: "app_play_result",
  });
}

async function ensureInitialCatalogLoaded() {
  if (!homeLoadPromise) {
    updateDiagnostic({
      homeLoadInFlight: true,
    });
    homeLoadPromise = loadHomeCatalog().finally(() => {
      updateDiagnostic({
        homeLoadInFlight: false,
      });
      homeLoadPromise = null;
    });
  }

  return homeLoadPromise;
}

function setupMessages() {
  if (messageHandlersInstalled) {
    return;
  }

  messageHandlersInstalled = true;

  sidebar.onMessage("ui_init", () => {
    uiInitialized = true;
    updateDiagnostic({
      lastUiMessage: "ui_init",
    });
    postState("connected", "Sidebar connected.");
    syncLatestPayloads();

    if (!lastCatalogPayload && !homeLoadPromise) {
      runDeferred(
        () => ensureInitialCatalogLoaded(),
        (error) => {
          logError("Initial catalog load failed", error);
          postState("error", "Không tải được dữ liệu.");
          postCatalogError(error && error.message ? error.message : "Unknown error");
        }
      );
    }
  });

  sidebar.onMessage("ui_search", (payload) => {
    updateDiagnostic({
      lastUiMessage: "ui_search",
    });
    runDeferred(
      () => searchCatalog(payload && payload.keyword ? payload.keyword : ""),
      (error) => {
        logError("Search failed", error);
        postState("error", "Không tải được dữ liệu.");
        postCatalogError(error && error.message ? error.message : "Unknown error");
      }
    );
  });

  sidebar.onMessage("ui_load_category", (payload) => {
    updateDiagnostic({
      lastUiMessage: "ui_load_category",
    });
    runDeferred(
      () => loadCategoryCatalog(payload && payload.slug ? payload.slug : DEFAULT_CATEGORY),
      (error) => {
        logError("Category load failed", error);
        postState("error", "Không tải được dữ liệu.");
        postCatalogError(error && error.message ? error.message : "Unknown error");
      }
    );
  });

  sidebar.onMessage("ui_open_detail", (payload) => {
    updateDiagnostic({
      lastUiMessage: "ui_open_detail",
    });
    runDeferred(
      () => loadDetail(payload && payload.slug ? payload.slug : ""),
      (error) => {
        logError("Detail load failed", error);
        postState("error", "Không tải được dữ liệu.");
        postCatalogError(error && error.message ? error.message : "Unknown error");
      }
    );
  });

  sidebar.onMessage("ui_play", (payload) => {
    updateDiagnostic({
      lastUiMessage: "ui_play",
    });
    runDeferred(
      () => playEntries(payload || {}),
      (error) => {
        logError("Play failed", error);
        postPlayFailure(payload || {}, error);
      }
    );
  });
}

postState("booting", "Khởi tạo plugin...");
event.on("mpv.file-loaded", () => {
  syncPlaybackStateFromContext();
});
event.on("mpv.playlist-pos.changed", () => {
  syncPlaybackStateFromContext();
});
event.on("iina.window-loaded", () => {
  updateDiagnostic({
    windowLoaded: true,
  });
  loadSidebar();
  setupMessages();
  sidebar.show();
  syncLatestPayloads();
  syncLatestPayloadsLater();

  ensureInitialCatalogLoaded().catch((error) => {
    logError("Initial catalog load failed", error);
    postState("error", "Không tải được dữ liệu.");
    postCatalogError(error && error.message ? error.message : "Unknown error");
  });

  setTimeout(() => {
    if (!initialized || uiInitialized) {
      return;
    }

    updateDiagnostic({
      lastError: "Waiting for ui_init from webview.",
    });
    syncLatestPayloads();
  }, 1500);
});
