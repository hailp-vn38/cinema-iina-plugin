import { useCallback } from "react";
import { useSourceProvider } from "./useSourceProvider";
import { FAVORITES_CATEGORY_SLUG, useAppStore } from "../store/appStore";

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown provider error";
}

export interface CatalogActions {
  loadHome: () => Promise<void>;
  loadFavorites: () => void;
  loadCategory: (slug: string) => Promise<void>;
  loadMore: () => Promise<void>;
  search: (keyword: string) => Promise<void>;
}

export function useCatalogActions(): CatalogActions {
  const provider = useSourceProvider();
  const activeSourceId = useAppStore((state) => state.activeSourceId);
  const catalogMode = useAppStore((state) => state.catalog.mode);
  const activeCategory = useAppStore((state) => state.catalog.activeCategory);
  const keyword = useAppStore((state) => state.catalog.keyword);
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
  const showFavoritesCatalog = useAppStore((state) => state.showFavoritesCatalog);

  const loadFavorites = useCallback((): void => {
    showFavoritesCatalog();
  }, [showFavoritesCatalog]);

  const loadHome = useCallback(async (): Promise<void> => {
    loadFavorites();
  }, [loadFavorites]);

  const loadCategory = useCallback(
    async (slug: string): Promise<void> => {
      if (slug === FAVORITES_CATEGORY_SLUG) {
        loadFavorites();
        return;
      }

      if (!provider || !provider.supports.categories || !provider.getCategory) {
        setCatalogError("Source này chưa hỗ trợ category.");
        return;
      }

      setCatalogLoading("Đang tải category từ " + provider.label + "...");
      try {
        const payload = await provider.getCategory(slug, 1);
        applyCatalogPayload(payload, activeSourceId);
      } catch (error) {
        setCatalogError(toErrorMessage(error));
      }
    },
    [
      activeSourceId,
      applyCatalogPayload,
      provider,
      setCatalogError,
      setCatalogLoading,
      loadFavorites,
    ],
  );

  const loadMore = useCallback(async (): Promise<void> => {
    if (catalogMode === "favorites" || activeCategory === FAVORITES_CATEGORY_SLUG) {
      return;
    }

    if (currentPage >= totalPages) {
      setCatalogError("Đã tải hết dữ liệu.");
      return;
    }

    const nextPage = currentPage + 1;
    setCatalogLoading("Đang tải trang " + nextPage + "...");
    try {
      if (!provider) {
        setCatalogError("Source không hợp lệ.");
        return;
      }

      let payload;

      if (catalogMode === "search") {
        if (!provider.supports.search || !provider.search || !keyword) {
          setCatalogError("Source này chưa hỗ trợ tải thêm kết quả tìm kiếm.");
          return;
        }
        payload = await provider.search(keyword, nextPage);
      } else if (catalogMode === "home") {
        if (!provider.supports.home || !provider.getHome) {
          setCatalogError("Source này chưa hỗ trợ trang chủ.");
          return;
        }
        payload = await provider.getHome(nextPage);
      } else {
        if (!activeCategory) {
          setCatalogError("Không có category được chọn.");
          return;
        }
        if (!provider.supports.categories || !provider.getCategory) {
          setCatalogError("Source này chưa hỗ trợ category.");
          return;
        }
        payload = await provider.getCategory(activeCategory, nextPage);
      }

      appendCatalogPayload(payload);
    } catch (error) {
      setCatalogError(toErrorMessage(error));
    }
  }, [
    catalogMode,
    activeCategory,
    appendCatalogPayload,
    currentPage,
    keyword,
    provider,
    setCatalogError,
    setCatalogLoading,
    totalPages,
  ]);

  const search = useCallback(
    async (keyword: string): Promise<void> => {
      const trimmedKeyword = String(keyword || "").trim();
      if (!trimmedKeyword) {
        loadFavorites();
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
        setCatalogError(toErrorMessage(error));
      }
    },
    [
      activeSourceId,
      applyCatalogPayload,
      loadFavorites,
      provider,
      setCatalogError,
      setCatalogLoading,
    ],
  );

  return {
    loadHome,
    loadFavorites,
    loadCategory,
    loadMore,
    search,
  };
}
