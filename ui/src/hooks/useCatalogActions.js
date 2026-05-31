import { useCallback, useEffect } from "react";
import { useSourceProvider } from "./useSourceProvider.js";
import { useAppStore } from "../store/appStore.js";

export function useCatalogActions() {
  const provider = useSourceProvider();
  const activeSourceId = useAppStore((state) => state.activeSourceId);
  const applyCatalogPayload = useAppStore((state) => state.applyCatalogPayload);
  const setCatalogLoading = useAppStore((state) => state.setCatalogLoading);
  const setCatalogError = useAppStore((state) => state.setCatalogError);

  const loadHome = useCallback(async () => {
    if (!provider || !provider.supports.home) {
      setCatalogError("Source này chưa hỗ trợ home.");
      return;
    }

    setCatalogLoading("Đang tải dữ liệu từ " + provider.label + "...");
    try {
      const payload = await provider.getHome();
      applyCatalogPayload(payload, activeSourceId);
    } catch (error) {
      setCatalogError(error && error.message ? error.message : "Unknown provider error");
    }
  }, [activeSourceId, applyCatalogPayload, provider, setCatalogError, setCatalogLoading]);

  const loadCategory = useCallback(
    async (slug) => {
      if (!provider || !provider.supports.categories || !provider.getCategory) {
        setCatalogError("Source này chưa hỗ trợ category.");
        return;
      }

      setCatalogLoading("Đang tải category từ " + provider.label + "...");
      try {
        const payload = await provider.getCategory(slug);
        applyCatalogPayload(payload, activeSourceId);
      } catch (error) {
        setCatalogError(error && error.message ? error.message : "Unknown provider error");
      }
    },
    [activeSourceId, applyCatalogPayload, provider, setCatalogError, setCatalogLoading]
  );

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
        setCatalogError(error && error.message ? error.message : "Unknown provider error");
      }
    },
    [activeSourceId, applyCatalogPayload, loadHome, provider, setCatalogError, setCatalogLoading]
  );

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  return {
    loadHome,
    loadCategory,
    search,
  };
}
