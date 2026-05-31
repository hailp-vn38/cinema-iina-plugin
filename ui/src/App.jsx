import { useEffect, useRef } from "react";
import { useAppStore } from "./store/appStore.js";
import { useRuntimeBridge } from "./hooks/useRuntimeBridge.js";
import { useCatalogActions } from "./hooks/useCatalogActions.js";
import { useDetailActions } from "./hooks/useDetailActions.js";
import { Header } from "./components/layout/Header.jsx";
import { CatalogView } from "./components/catalog/CatalogView.jsx";
import { DetailView } from "./components/detail/DetailView.jsx";
import { DiagnosticPanel } from "./components/diagnostic/DiagnosticPanel.jsx";

export default function App() {
  useRuntimeBridge();

  const sources = useAppStore((state) => state.sources);
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

  const { loadHome, loadMore, loadCategory, search } = useCatalogActions();
  const { openDetail, closeDetail, selectServer, playEpisode, playAll } =
    useDetailActions();

  const appShellRef = useRef(null);
  const lastScrollRef = useRef(0);

  useEffect(() => {
    loadHome();
  }, [activeSourceId, loadHome]);

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
        categories={catalog.categories}
        activeCategory={catalog.activeCategory}
        onCategorySelect={loadCategory}
      />

      <section className="content-shell">
        {status === "loading" && (
          <div className="loading-banner">{message || "Đang cập nhật..."}</div>
        )}

        {view === "detail" && detail ? (
          <>
            <DetailView
              detail={detail}
              playback={playback}
              onBack={closeDetail}
              onSelectServer={selectServer}
              onPlayEpisode={playEpisode}
              onPlayAll={playAll}
            />
            <DiagnosticPanel
              diagnostic={diagnostic}
              status={status}
              message={message}
              view={view}
              lastEventName={lastEventName}
              runtimeEventCount={runtimeEventCount}
              playback={playback}
            />
          </>
        ) : (
          <>
            <CatalogView
              title={catalog.title}
              subtitle={catalog.subtitle}
              items={catalog.items}
              sourceId={catalog.sourceId}
              pagination={catalog.pagination}
              onLoadMore={loadMore}
              onOpenDetail={openDetail}
              isLoading={status === "loading"}
            />
            <DiagnosticPanel
              diagnostic={diagnostic}
              status={status}
              message={message}
              view={view}
              lastEventName={lastEventName}
              runtimeEventCount={runtimeEventCount}
              playback={playback}
            />
          </>
        )}
      </section>
    </main>
  );
}
