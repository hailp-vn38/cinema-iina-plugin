import { useCallback } from "react";
import { useSourceProvider } from "./useSourceProvider.js";
import { useAppStore } from "../store/appStore.js";

export function useCatalogActions() {
  const provider = useSourceProvider();
  const activeSourceId = useAppStore((state) => state.activeSourceId);
  const activeCategory = useAppStore((state) => state.catalog.activeCategory);
  const currentPage = useAppStore(
    (state) => state.catalog.pagination.currentPage,
  );
  const totalPages = useAppStore(
    (state) => state.catalog.pagination.totalPages,
  );
  const applyCatalogPayload = useAppStore((state) => state.applyCatalogPayload);
  const appendCatalogPayload = useAppStore(
    (state) => state.appendCatalogPayload,
  );
  const setCatalogLoading = useAppStore((state) => state.setCatalogLoading);
  const setCatalogError = useAppStore((state) => state.setCatalogError);

  const loadHome = useCallback(async () => {
    console.log("[useCatalogActions] loadHome called, provider:", provider);
    if (!provider || !provider.supports.home) {
      setCatalogError("Source này chưa hỗ trợ home.");
      return;
    }

    setCatalogLoading("Đang tải dữ liệu từ " + provider.label + "...");
    try {
      const payload = await provider.getHome();
      console.log("[useCatalogActions] loadHome success:", payload);
      applyCatalogPayload(payload, activeSourceId);
    } catch (error) {
      console.error("[useCatalogActions] loadHome error:", error);
      setCatalogError(
        error && error.message ? error.message : "Unknown provider error",
      );
    }
  }, [
    activeSourceId,
    applyCatalogPayload,
    provider,
    setCatalogError,
    setCatalogLoading,
  ]);

  const loadCategory = useCallback(
    async (slug) => {
      if (!provider || !provider.supports.categories || !provider.getCategory) {
        setCatalogError("Source này chưa hỗ trợ category.");
        return;
      }

      setCatalogLoading("Đang tải category từ " + provider.label + "...");
      try {
        const payload = await provider.getCategory(slug, 1);
        applyCatalogPayload(payload, activeSourceId);
      } catch (error) {
        setCatalogError(
          error && error.message ? error.message : "Unknown provider error",
        );
      }
    },
    [
      activeSourceId,
      applyCatalogPayload,
      provider,
      setCatalogError,
      setCatalogLoading,
    ],
  );

  const loadMore = useCallback(async () => {
    console.log(
      "[useCatalogActions] loadMore called, activeCategory:",
      activeCategory,
      "currentPage:",
      currentPage,
      "totalPages:",
      totalPages,
    );

    if (!activeCategory) {
      console.warn("[useCatalogActions] No activeCategory, aborting");
      setCatalogError("Không có category được chọn.");
      return;
    }

    if (currentPage >= totalPages) {
      console.warn("[useCatalogActions] Already at end, aborting");
      setCatalogError("Đã tải hết dữ liệu.");
      return;
    }

    if (!provider || !provider.supports.categories || !provider.getCategory) {
      console.warn("[useCatalogActions] Provider doesn't support categories");
      setCatalogError("Source này chưa hỗ trợ category.");
      return;
    }

    const nextPage = currentPage + 1;
    setCatalogLoading("Đang tải trang " + nextPage + "...");
    try {
      console.log(
        "[useCatalogActions] Fetching category:",
        activeCategory,
        "page:",
        nextPage,
      );
      const payload = await provider.getCategory(activeCategory, nextPage);
      console.log(
        "[useCatalogActions] loadMore success, page:",
        nextPage,
        "items:",
        payload?.items?.length || 0,
      );
      appendCatalogPayload(payload, activeSourceId);
    } catch (error) {
      console.error("[useCatalogActions] loadMore error:", error);
      setCatalogError(
        error && error.message ? error.message : "Unknown provider error",
      );
    }
  }, [
    activeCategory,
    activeSourceId,
    appendCatalogPayload,
    currentPage,
    provider,
    setCatalogError,
    setCatalogLoading,
    totalPages,
  ]);

  const search = useCallback(
    async (keyword) => {
      const trimmedKeyword = String(keyword || "").trim();
      if (!trimmedKeyword) {
        await loadHome();
        return;
      }

      if (!provider || !provider.supports.search || !provider.search) {
        setCatalogError("Source này chưa hỗ trợ tìm kiếm.");
        return;
      }

      setCatalogLoading('Đang tìm kiếm "' + trimmedKeyword + '"...');
      try {
        const payload = await provider.search(trimmedKeyword);
        applyCatalogPayload(payload, activeSourceId);
      } catch (error) {
        setCatalogError(
          error && error.message ? error.message : "Unknown provider error",
        );
      }
    },
    [
      activeSourceId,
      applyCatalogPayload,
      loadHome,
      provider,
      setCatalogError,
      setCatalogLoading,
    ],
  );

  return {
    loadHome,
    loadCategory,
    loadMore,
    search,
  };
}
