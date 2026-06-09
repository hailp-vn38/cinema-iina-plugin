import { useEffect, useRef } from "react";
import type { ReactElement } from "react";
import type { CatalogItem, ProviderCategory } from "@shared/contracts/models";
import { useAppStore } from "./store/appStore";
import type { FavoriteEntry } from "./store/types";
import { useRuntimeBridge } from "./hooks/useRuntimeBridge";
import { useCatalogActions } from "./hooks/useCatalogActions";
import { useDetailActions } from "./hooks/useDetailActions";
import { useFavoriteActions } from "./hooks/useFavoriteActions";
import { useFavoritePersistence } from "./hooks/useFavoritePersistence";
import { useSourceProvider } from "./hooks/useSourceProvider";
import { Header } from "./components/layout/Header";
import { CatalogView } from "./components/catalog/CatalogView";
import { DetailView } from "./components/detail/DetailView";

interface FavoriteCatalogItem extends CatalogItem {
  sourceLabel: string;
  serverId: string;
  serverName: string;
  updatedAt: string;
  updatedAtLabel: string;
  episodeIndex: number;
  episodeName: string;
  entries: FavoriteEntry["entries"];
}

export default function App(): ReactElement {
  useRuntimeBridge();
  useFavoritePersistence();

  const sources = useAppStore((state) => state.sources);
  const favorites = useAppStore((state) => state.favorites);
  const activeSourceId = useAppStore((state) => state.activeSourceId);
  const setActiveSource = useAppStore((state) => state.setActiveSource);
  const status = useAppStore((state) => state.status);
  const message = useAppStore((state) => state.message);
  const view = useAppStore((state) => state.view);
  const catalog = useAppStore((state) => state.catalog);
  const detail = useAppStore((state) => state.detail.data);
  const playback = useAppStore((state) => state.playback);
  const diagnostic = useAppStore((state) => state.diagnostic);
  const lastEventName = useAppStore((state) => state.lastEventName);
  const runtimeEventCount = useAppStore((state) => state.runtimeEventCount);
  const provider = useSourceProvider();

  const { loadHome, loadMore, loadCategory, search } = useCatalogActions();
  const {
    openDetail,
    closeDetail,
    selectServer,
    playEpisode,
    playAll,
    toggleFavorite,
  } = useDetailActions();
  const { restoreFavoriteEntry, removeFavorite, clearFavorites } =
    useFavoriteActions();

  const appShellRef = useRef<HTMLElement | null>(null);
  const lastScrollRef = useRef(0);
  const syncedPlaybackKeyRef = useRef("");

  useEffect(() => {
    loadHome();
  }, [activeSourceId, loadHome]);

  useEffect(() => {
    if (diagnostic.runtimeMode !== "sidebar-runtime") {
      return;
    }

    if (!playback.active || !playback.detailSlug || !playback.sourceId) {
      return;
    }

    const playbackKey = [
      playback.sourceId,
      playback.detailSlug,
      playback.serverId,
      playback.episodeIndex,
    ].join(":");

    const detailMatches =
      detail &&
      detail.sourceId === playback.sourceId &&
      detail.slug === playback.detailSlug;

    if (detailMatches && syncedPlaybackKeyRef.current === playbackKey) {
      return;
    }

    if (activeSourceId !== playback.sourceId) {
      syncedPlaybackKeyRef.current = "";
      setActiveSource(playback.sourceId);
      return;
    }

    const matchingFavoriteEntry = favorites.find(
      (item) =>
        item.sourceId === playback.sourceId &&
        item.detailSlug === playback.detailSlug,
    );

    syncedPlaybackKeyRef.current = playbackKey;
    void openDetail(playback.detailSlug, matchingFavoriteEntry || undefined);
  }, [
    activeSourceId,
    detail,
    diagnostic.runtimeMode,
    favorites,
    openDetail,
    playback.active,
    playback.detailSlug,
    playback.episodeIndex,
    playback.serverId,
    playback.sourceId,
    setActiveSource,
  ]);

  const catalogItems: Array<CatalogItem | FavoriteCatalogItem> =
    catalog.mode === "favorites"
        ? favorites.map((item) => ({
          id: item.id,
          sourceId: item.sourceId,
          movieId: item.movieId,
          detailSlug: item.detailSlug,
          title: item.title,
          sourceLabel: item.sourceId ? item.sourceId.toUpperCase() : "",
          slug: item.detailSlug,
          name: item.title,
          originName: item.originName,
          posterUrl: item.posterUrl,
          year: "",
          quality: "",
          lang: "",
          episodeCurrent: "",
          type: "",
          serverId: item.serverId,
          serverName: item.serverName,
          updatedAt: item.updatedAt,
          updatedAtLabel: "Yêu thích",
          episodeIndex: item.episodeIndex,
          episodeName: item.episodeName,
          entries: item.entries,
        }))
      : catalog.items;

  const isDetailFavorite = Boolean(
    detail &&
      favorites.some(
        (item) => item.sourceId === detail.sourceId && item.detailSlug === detail.slug,
      ),
  );

  const headerCategories: ProviderCategory[] =
    catalog.categories && catalog.categories.length
      ? catalog.categories
      : provider && Array.isArray(provider.categories)
        ? provider.categories
        : [];

  useEffect(() => {
    const container = appShellRef.current;
    if (!container) {
      return undefined;
    }

    function handleScroll(event: Event): void {
      if (view !== "catalog") {
        return;
      }

      const target = event.target as HTMLElement | null;
      const scrollTop = target?.scrollTop || 0;
      const delta = scrollTop - lastScrollRef.current;
      lastScrollRef.current = scrollTop;

      if (scrollTop <= 0 && delta < -5) {
        void loadHome();
      }
    }

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [loadHome, view]);

  return (
    <main className="app-shell" ref={appShellRef}>
      <Header
        sources={sources}
        activeSourceId={activeSourceId}
        onSourceChange={setActiveSource}
        keyword={catalog.keyword}
        onSearch={search}
        categories={headerCategories}
        activeCategory={catalog.activeCategory}
        onCategorySelect={loadCategory}
      />

      <section className="content-shell">
        {status === "loading" && (
          <div className="loading-banner">{message || "Đang cập nhật..."}</div>
        )}

        {view === "detail" && detail ? (
          <DetailView
            detail={detail}
            playback={playback}
            isFavorite={isDetailFavorite}
            onBack={closeDetail}
            onSelectServer={selectServer}
            onPlayEpisode={playEpisode}
            onPlayAll={playAll}
            onToggleFavorite={toggleFavorite}
          />
        ) : (
          <CatalogView
            mode={catalog.mode}
            title={catalog.title}
            subtitle={catalog.subtitle}
            items={catalogItems}
            sourceId={catalog.sourceId}
            pagination={catalog.pagination}
            onLoadMore={loadMore}
            onOpenDetail={openDetail}
            isLoading={status === "loading"}
            onRestoreFavorite={restoreFavoriteEntry}
            onRemoveFavorite={removeFavorite}
            onClearFavorites={clearFavorites}
          />
        )}

      </section>
    </main>
  );
}
