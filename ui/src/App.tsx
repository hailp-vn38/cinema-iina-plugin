import { useEffect, useRef } from "react";
import type { ReactElement } from "react";
import type { CatalogItem, ProviderCategory } from "@shared/contracts/models";
import { useAppStore } from "./store/appStore";
import type { HistoryEntry } from "./store/types";
import { useRuntimeBridge } from "./hooks/useRuntimeBridge";
import { useCatalogActions } from "./hooks/useCatalogActions";
import { useDetailActions } from "./hooks/useDetailActions";
import { useHistoryActions } from "./hooks/useHistoryActions";
import { useHistoryPersistence } from "./hooks/useHistoryPersistence";
import { useSourceProvider } from "./hooks/useSourceProvider";
import { Header } from "./components/layout/Header";
import { CatalogView } from "./components/catalog/CatalogView";
import { DetailView } from "./components/detail/DetailView";
import { DiagnosticPanel } from "./components/diagnostic/DiagnosticPanel";

interface HistoryCatalogItem extends CatalogItem {
  sourceLabel: string;
  serverId: string;
  serverName: string;
  updatedAt: string;
  updatedAtLabel: string;
  episodeIndex: number;
  episodeName: string;
  entries: HistoryEntry["entries"];
}

export default function App(): ReactElement {
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
  const diagnostic = useAppStore((state) => state.diagnostic);
  const lastEventName = useAppStore((state) => state.lastEventName);
  const runtimeEventCount = useAppStore((state) => state.runtimeEventCount);
  const provider = useSourceProvider();

  const { loadHome, loadMore, loadCategory, search } = useCatalogActions();
  const { openDetail, closeDetail, selectServer, playEpisode, playAll } =
    useDetailActions();
  const { restoreHistoryEntry, removeHistory, clearHistory } =
    useHistoryActions();

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

    const matchingHistoryEntry = history.find(
      (item) =>
        item.sourceId === playback.sourceId &&
        item.detailSlug === playback.detailSlug &&
        item.serverId === playback.serverId,
    );

    syncedPlaybackKeyRef.current = playbackKey;
    void openDetail(playback.detailSlug, matchingHistoryEntry || undefined);
  }, [
    activeSourceId,
    detail,
    diagnostic.runtimeMode,
    history,
    openDetail,
    playback.active,
    playback.detailSlug,
    playback.episodeIndex,
    playback.serverId,
    playback.sourceId,
    setActiveSource,
  ]);

  const catalogItems: Array<CatalogItem | HistoryCatalogItem> =
    catalog.mode === "history"
        ? history.map((item) => ({
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
          updatedAtLabel: "Đã lưu",
          episodeIndex: item.episodeIndex,
          episodeName: item.episodeName,
          entries: item.entries,
        }))
      : catalog.items;

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

        <DiagnosticPanel
          diagnostic={diagnostic}
          status={status}
          message={message}
          view={view}
          lastEventName={lastEventName}
          runtimeEventCount={runtimeEventCount}
          playback={playback}
        />
      </section>
    </main>
  );
}
