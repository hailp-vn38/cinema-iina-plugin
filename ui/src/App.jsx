import { useEffect, useRef } from "react";
import { useAppStore } from "./store/appStore.js";
import { useRuntimeBridge } from "./hooks/useRuntimeBridge.js";
import { useCatalogActions } from "./hooks/useCatalogActions.js";
import { useDetailActions } from "./hooks/useDetailActions.js";
import { useHistoryActions } from "./hooks/useHistoryActions.js";
import { useHistoryPersistence } from "./hooks/useHistoryPersistence.js";
import { useSourceProvider } from "./hooks/useSourceProvider.js";
import { Header } from "./components/layout/Header.jsx";
import { CatalogView } from "./components/catalog/CatalogView.jsx";
import { DetailView } from "./components/detail/DetailView.jsx";

export default function App() {
  useRuntimeBridge();
  useHistoryPersistence();

  const sources = useAppStore((state) => state.sources);
  const history = useAppStore((state) => state.history);
  const activeSourceId = useAppStore((state) => state.activeSourceId);
  const setActiveSource = useAppStore((state) => state.setActiveSource);
  const status = useAppStore((state) => state.status);
  const message = useAppStore((state) => state.message);
  const view = useAppStore((state) => state.view);
  const catalog = useAppStore((state) => state.catalog);
  const detail = useAppStore((state) => state.detail.data);
  const playback = useAppStore((state) => state.playback);
  const provider = useSourceProvider();

  const { loadHome, loadMore, loadCategory, search } = useCatalogActions();
  const { openDetail, closeDetail, selectServer, playEpisode, playAll } =
    useDetailActions();
  const { restoreHistoryEntry, removeHistory, clearHistory } =
    useHistoryActions();

  const appShellRef = useRef(null);
  const lastScrollRef = useRef(0);

  useEffect(() => {
    loadHome();
  }, [activeSourceId, loadHome]);

  const catalogItems =
    catalog.mode === "history"
      ? history.map((item) => ({
          id: item.id,
          sourceId: item.sourceId,
          sourceLabel: item.sourceId ? item.sourceId.toUpperCase() : "",
          slug: item.detailSlug,
          name: item.title,
          originName: item.originName,
          posterUrl: item.posterUrl,
          serverId: item.serverId,
          serverName: item.serverName,
          updatedAt: item.updatedAt,
          updatedAtLabel: "Đã lưu",
          episodeIndex: item.episodeIndex,
          episodeName: item.episodeName,
          entries: item.entries,
        }))
      : catalog.items;
  const headerCategories =
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

    function handleScroll(event) {
      if (view !== "catalog") {
        return;
      }

      const scrollTop = event.target.scrollTop;
      const delta = scrollTop - lastScrollRef.current;
      lastScrollRef.current = scrollTop;

      if (scrollTop <= 0 && delta < -5) {
        loadHome();
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
            onBack={closeDetail}
            onSelectServer={selectServer}
            onPlayEpisode={playEpisode}
            onPlayAll={playAll}
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
            onRestoreHistory={restoreHistoryEntry}
            onRemoveHistory={removeHistory}
            onClearHistory={clearHistory}
          />
        )}
      </section>
    </main>
  );
}
