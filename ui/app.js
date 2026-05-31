const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const categoryList = document.getElementById("category-list");
const catalogTitle = document.getElementById("catalog-title");
const catalogSubtitle = document.getElementById("catalog-subtitle");
const statusBadge = document.getElementById("status-badge");
const statusText = document.getElementById("status-text");
const errorBanner = document.getElementById("error-banner");
const resultsList = document.getElementById("results-list");
const diagnosticOutput = document.getElementById("diagnostic-output");
const diagnosticPingButton = document.getElementById("diagnostic-ping");

const state = {
  title: "Đang tải",
  subtitle: "",
  status: "idle",
  message: "",
  items: [],
  categories: [],
  activeCategory: "phim-moi",
  mode: "home",
  keyword: "",
  connected: false,
  runtimeReady: false,
  lastActionAt: 0,
  pendingPlayRequestId: "",
  detail: null,
  catalogSnapshot: null,
  playback: {
    active: false,
    title: "",
    episodeName: "",
    episodeIndex: -1,
    detailSlug: "",
    url: "",
  },
  diagnostic: {
    pageLoadedAt: new Date().toISOString(),
    pluginVersion: "",
    initAttempts: 0,
    lastOutbound: "",
    lastInbound: "",
    lastError: "",
    sidebarLoaded: false,
    windowLoaded: false,
    lastUiMessage: "",
    lastAppMessage: "",
    lastCatalogMode: "",
    homeLoadInFlight: false,
  },
};

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderCategories() {
  categoryList.innerHTML = state.categories
    .map((category) => {
      const activeClass =
        category.slug === state.activeCategory ? "chip is-active" : "chip";

      return (
        '<button class="' +
        activeClass +
        '" type="button" data-category="' +
        escapeHtml(category.slug) +
        '">' +
        escapeHtml(category.label) +
        "</button>"
      );
    })
    .join("");
}

function renderMovies(items) {
  if (!items.length) {
    resultsList.innerHTML =
      '<div class="empty-state">Không có phim cho lựa chọn hiện tại.</div>';
    return;
  }

  resultsList.innerHTML = items
    .map((item) => {
      const meta = [item.year, item.type, item.quality, item.lang]
        .filter(Boolean)
        .map((part) => "<span>" + escapeHtml(part) + "</span>")
        .join("");

      const posterMarkup = item.posterUrl
        ? '<img class="movie-poster movie-poster--image" src="' +
          escapeHtml(item.posterUrl) +
          '" alt="' +
          escapeHtml(item.name) +
          '" />'
        : '<div class="movie-poster">' + escapeHtml(item.name.slice(0, 1)) + "</div>";

      return (
        '<article class="movie-card">' +
        posterMarkup +
        '<div class="movie-content">' +
        '<h3 class="movie-title">' +
        escapeHtml(item.name) +
        "</h3>" +
        '<p class="movie-origin">' + escapeHtml(item.originName) + "</p>" +
        '<div class="movie-meta">' +
        meta +
        "</div>" +
        '<p class="movie-episode">' +
        escapeHtml(item.episodeCurrent) +
        "</p>" +
        '<button class="ghost-button movie-play-button" type="button" data-open-detail="' +
        escapeHtml(item.slug) +
        '">' +
        "Xem chi tiet" +
        "</button>" +
        "</div>" +
        "</article>"
      );
    })
    .join("");
}

function renderDetail(detail) {
  if (!detail) {
    resultsList.innerHTML = '<div class="empty-state">Khong co du lieu chi tiet.</div>';
    return;
  }

  const posterMarkup = detail.posterUrl
    ? '<img class="detail-poster" src="' +
      escapeHtml(detail.posterUrl) +
      '" alt="' +
      escapeHtml(detail.title) +
      '" />'
    : '<div class="detail-poster detail-poster--fallback">' +
      escapeHtml(detail.title.slice(0, 1)) +
      "</div>";

  const meta = [detail.year, detail.quality, detail.lang, detail.time]
    .filter(Boolean)
    .map((part) => '<span class="detail-meta-pill">' + escapeHtml(part) + "</span>")
    .join("");

  const episodes = (detail.entries || [])
    .map((entry, index) => {
      const isCurrent =
        state.playback.active &&
        state.playback.detailSlug === detail.slug &&
        state.playback.episodeIndex === index;
      return (
        '<button class="' +
        (isCurrent ? "episode-button is-current" : "episode-button") +
        '" type="button" data-play-index="' +
        String(index) +
        '">' +
        escapeHtml(entry.name || "Tap " + (index + 1)) +
        "</button>"
      );
    })
    .join("");

  const playingNow =
    state.playback.active && state.playback.detailSlug === detail.slug
      ? '<p class="detail-now-playing">Dang xem: ' +
        escapeHtml(
          state.playback.episodeName
            ? detail.title + " - " + state.playback.episodeName
            : state.playback.title || detail.title
        ) +
        "</p>"
      : "";

  resultsList.innerHTML =
    '<article class="detail-card">' +
    '<div class="detail-toolbar">' +
    '<button class="ghost-button" type="button" data-back-catalog="1">Quay lai</button>' +
    '<button class="primary-button" type="button" data-play-all="1">Play all</button>' +
    "</div>" +
    '<div class="detail-hero">' +
    posterMarkup +
    '<div class="detail-content">' +
    '<h3 class="detail-title">' +
    escapeHtml(detail.title) +
    "</h3>" +
    '<p class="detail-origin">' + escapeHtml(detail.originName) + "</p>" +
    '<div class="detail-meta">' + meta + "</div>" +
    '<p class="detail-server">Server: ' +
    escapeHtml(detail.serverName || "Mac dinh") +
    "</p>" +
    playingNow +
    '<p class="detail-summary">' +
    escapeHtml(detail.content || detail.episodeCurrent || "Khong co mo ta.") +
    "</p>" +
    "</div>" +
    "</div>" +
    '<div class="episode-section">' +
    '<div class="episode-section-header">' +
    '<h4 class="episode-section-title">Danh sach tap</h4>' +
    '<span class="episode-section-count">' +
    String((detail.entries || []).length) +
    " tap</span>" +
    "</div>" +
    '<div class="episode-grid">' +
    episodes +
    "</div>" +
    "</div>" +
    "</article>";
}

function renderError(message) {
  if (!message) {
    errorBanner.textContent = "";
    errorBanner.classList.add("is-hidden");
    return;
  }

  errorBanner.textContent = message;
  errorBanner.classList.remove("is-hidden");
}

function render() {
  catalogTitle.textContent = state.title;
  catalogSubtitle.textContent = state.subtitle || state.message;
  statusBadge.textContent = state.status;
  statusText.textContent = state.message || "";
  renderCategories();
  if (state.mode === "detail") {
    renderDetail(state.detail);
  } else {
    renderMovies(state.items);
  }
  renderDiagnostic();
}

function renderDiagnostic() {
  const rows = [
    ["pageLoadedAt", state.diagnostic.pageLoadedAt],
    ["pluginVersion", state.diagnostic.pluginVersion],
    ["connected", state.connected ? "yes" : "no"],
    ["runtimeReady", state.runtimeReady ? "yes" : "no"],
    ["initAttempts", String(state.diagnostic.initAttempts)],
    ["lastOutbound", state.diagnostic.lastOutbound],
    ["lastInbound", state.diagnostic.lastInbound],
    ["lastError", state.diagnostic.lastError],
    ["sidebarLoaded", state.diagnostic.sidebarLoaded ? "yes" : "no"],
    ["windowLoaded", state.diagnostic.windowLoaded ? "yes" : "no"],
    ["pluginLastUi", state.diagnostic.lastUiMessage],
    ["pluginLastApp", state.diagnostic.lastAppMessage],
    ["catalogMode", state.diagnostic.lastCatalogMode],
    ["homeLoadInFlight", state.diagnostic.homeLoadInFlight ? "yes" : "no"],
    ["pendingPlayId", state.pendingPlayRequestId],
  ];

  diagnosticOutput.innerHTML = rows
    .map(([key, value]) => {
      return (
        '<div class="diagnostic-row">' +
        '<div class="diagnostic-key">' +
        escapeHtml(key) +
        "</div>" +
        '<div class="diagnostic-value">' +
        escapeHtml(value || "-") +
        "</div>" +
        "</div>"
      );
    })
    .join("");
}

function recordOutbound(name) {
  state.diagnostic.lastOutbound = name;
}

function recordInbound(name) {
  state.diagnostic.lastInbound = name;
}

function postToPlugin(name, payload) {
  recordOutbound(name);
  renderDiagnostic();
  iina.postMessage(name, payload);
}

function markLoading(message) {
  state.lastActionAt = Date.now();
  state.status = "loading";
  state.message = message;
  renderError("");
  render();
}

function startPlay(payload, loadingMessage) {
  const requestId = "play-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  state.pendingPlayRequestId = requestId;
  markLoading(loadingMessage);
  postToPlugin(
    "ui_play",
    Object.assign({}, payload, {
      requestId: requestId,
    })
  );
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const keyword = searchInput.value.trim();
  state.keyword = keyword;
  state.detail = null;
  state.catalogSnapshot = null;
  state.mode = keyword ? "search" : "home";
  markLoading(keyword ? "Đang tìm kiếm..." : "Đang tải phim mới...");
  postToPlugin("ui_search", { keyword: keyword });
});

categoryList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) {
    return;
  }

  const slug = button.getAttribute("data-category");
  state.keyword = "";
  state.detail = null;
  state.catalogSnapshot = null;
  state.mode = "category";
  searchInput.value = "";
  markLoading("Đang tải danh sách...");
  postToPlugin("ui_load_category", { slug: slug });
});

resultsList.addEventListener("click", (event) => {
  const backButton = event.target.closest("[data-back-catalog]");
  if (backButton) {
    if (state.catalogSnapshot) {
      state.mode = state.catalogSnapshot.mode;
      state.title = state.catalogSnapshot.title;
      state.subtitle = state.catalogSnapshot.subtitle;
      state.items = state.catalogSnapshot.items;
      state.activeCategory = state.catalogSnapshot.activeCategory;
    } else {
      state.mode = "home";
    }
    state.detail = null;
    state.message = "Đã quay lại danh sách.";
    render();
    return;
  }

  const openDetailButton = event.target.closest("[data-open-detail]");
  if (openDetailButton) {
    const slug = openDetailButton.getAttribute("data-open-detail");
    state.catalogSnapshot = {
      mode: state.mode,
      title: state.title,
      subtitle: state.subtitle,
      items: state.items.slice(),
      activeCategory: state.activeCategory,
    };
    markLoading("Đang lấy thông tin phim...");
    postToPlugin("ui_open_detail", { slug: slug });
    return;
  }

  const playAllButton = event.target.closest("[data-play-all]");
  if (playAllButton && state.detail) {
    startPlay(
      {
        title: state.detail.title,
        detailSlug: state.detail.slug,
        entries: state.detail.entries,
        playMode: "all",
      },
      "Đang thêm playlist..."
    );
    return;
  }

  const playEpisodeButton = event.target.closest("[data-play-index]");
  if (playEpisodeButton && state.detail) {
    const index = Number(playEpisodeButton.getAttribute("data-play-index") || "0");
    startPlay(
      {
        title: state.detail.title,
        detailSlug: state.detail.slug,
        entries: state.detail.entries,
        playMode: "single",
        episodeIndex: index,
      },
      "Đang mở tập..."
    );
  }
});

iina.onMessage("app_state", (payload) => {
  recordInbound("app_state");
  state.connected = true;
  state.runtimeReady = true;
  state.status = payload && payload.status ? payload.status : "unknown";
  state.message = payload && payload.message ? payload.message : "";
  render();
});

iina.onMessage("catalog_data", (payload) => {
  recordInbound("catalog_data");
  state.runtimeReady = true;
  state.mode = payload && payload.mode ? payload.mode : "home";
  state.title = payload && payload.title ? payload.title : "Catalog";
  state.subtitle = payload && payload.subtitle ? payload.subtitle : "";
  state.items = payload && Array.isArray(payload.items) ? payload.items : [];
  state.categories = payload && Array.isArray(payload.categories) ? payload.categories : [];
  state.activeCategory = payload && payload.activeCategory ? payload.activeCategory : "";
  state.detail = null;
  state.catalogSnapshot = null;
  state.lastActionAt = 0;
  renderError("");
  render();
});

iina.onMessage("detail_data", (payload) => {
  recordInbound("detail_data");
  state.runtimeReady = true;
  state.mode = "detail";
  state.detail = payload || null;
  state.title = payload && payload.title ? payload.title : "Chi tiet";
  state.subtitle = payload && payload.originName ? payload.originName : "";
  state.lastActionAt = 0;
  renderError("");
  render();
});

iina.onMessage("catalog_error", (payload) => {
  recordInbound("catalog_error");
  state.runtimeReady = true;
  state.status = "error";
  state.message = "Không tải được dữ liệu.";
  state.lastActionAt = 0;
  state.diagnostic.lastError = payload && payload.message ? payload.message : "Unknown error";
  renderError(state.diagnostic.lastError);
  render();
});

iina.onMessage("app_play_ack", (payload) => {
  recordInbound("app_play_ack");
  if (!payload || payload.requestId !== state.pendingPlayRequestId) {
    return;
  }

  state.message = "Plugin đã nhận lệnh phát.";
  render();
});

iina.onMessage("app_play_result", (payload) => {
  recordInbound("app_play_result");
  if (!payload || payload.requestId !== state.pendingPlayRequestId) {
    return;
  }

  state.pendingPlayRequestId = "";
  state.lastActionAt = 0;

  if (payload.ok) {
    state.status = "ready";
    state.message =
      payload.mode === "playlist" ? "Đã thêm vào playlist." : "Đang phát phim.";
    renderError("");
  } else {
    state.status = "error";
    state.message = "Không phát được phim.";
    state.diagnostic.lastError = payload.error || "Không phát được phim.";
    renderError(state.diagnostic.lastError);
  }

  render();
});

iina.onMessage("app_playback_state", (payload) => {
  recordInbound("app_playback_state");
  state.playback = {
    active: Boolean(payload && payload.active),
    title: payload && payload.title ? payload.title : "",
    episodeName: payload && payload.episodeName ? payload.episodeName : "",
    episodeIndex:
      payload && typeof payload.episodeIndex === "number" ? payload.episodeIndex : -1,
    detailSlug: payload && payload.detailSlug ? payload.detailSlug : "",
    url: payload && payload.url ? payload.url : "",
  };
  render();
});

iina.onMessage("app_diagnostic", (payload) => {
  recordInbound("app_diagnostic");
  state.connected = true;
  state.diagnostic.pluginVersion =
    payload && payload.pluginVersion ? String(payload.pluginVersion) : "";
  state.diagnostic.sidebarLoaded = Boolean(payload && payload.sidebarLoaded);
  state.diagnostic.windowLoaded = Boolean(payload && payload.windowLoaded);
  state.diagnostic.lastUiMessage = payload && payload.lastUiMessage ? payload.lastUiMessage : "";
  state.diagnostic.lastAppMessage =
    payload && payload.lastAppMessage ? payload.lastAppMessage : "";
  state.diagnostic.lastCatalogMode =
    payload && payload.lastCatalogMode ? payload.lastCatalogMode : "";
  state.diagnostic.homeLoadInFlight = Boolean(payload && payload.homeLoadInFlight);
  if (payload && payload.lastError) {
    state.diagnostic.lastError = payload.lastError;
  }
  renderDiagnostic();
});

resultsList.addEventListener(
  "error",
  (event) => {
    const target = event.target;
    if (!target || !target.classList) {
      return;
    }

    const isMoviePoster = target.classList.contains("movie-poster--image");
    const isDetailPoster = target.classList.contains("detail-poster");
    if (!isMoviePoster && !isDetailPoster) {
      return;
    }

    const fallback = document.createElement("div");
    fallback.className = isDetailPoster
      ? "detail-poster detail-poster--fallback"
      : "movie-poster";
    fallback.textContent = (target.getAttribute("alt") || "?").slice(0, 1);
    target.replaceWith(fallback);
  },
  true
);

window.addEventListener("error", (event) => {
  state.diagnostic.lastError = "Webview error: " + (event.message || "Unknown error");
  renderError(state.diagnostic.lastError);
  renderDiagnostic();
});

diagnosticPingButton.addEventListener("click", () => {
  state.diagnostic.lastError = "";
  postToPlugin("ui_init", {
    ready: true,
    manual: true,
    attempt: state.diagnostic.initAttempts,
  });
});

let initAttempts = 0;
const initTimer = setInterval(() => {
  if (state.runtimeReady || state.items.length > 0) {
    clearInterval(initTimer);
    return;
  }

  initAttempts += 1;
  state.diagnostic.initAttempts = initAttempts;
  state.status = "connecting";
  state.message = "Connecting to plugin runtime... attempt " + initAttempts;
  render();
  postToPlugin("ui_init", {
    ready: true,
    attempt: initAttempts,
  });

  if (initAttempts >= 10 && !state.runtimeReady) {
    clearInterval(initTimer);
    if (!state.items.length) {
      state.diagnostic.lastError = "Không kết nối được với plugin runtime.";
      renderError(state.diagnostic.lastError);
      renderDiagnostic();
    }
  }
}, 800);

setInterval(() => {
  if (!state.lastActionAt) {
    return;
  }

  if (Date.now() - state.lastActionAt < 12000) {
    return;
  }

  if (state.status === "loading") {
    state.diagnostic.lastError = "Action không nhận được phản hồi từ plugin.";
    renderError(state.diagnostic.lastError);
    state.status = "error";
    state.lastActionAt = 0;
    state.pendingPlayRequestId = "";
    render();
  }
}, 1500);
