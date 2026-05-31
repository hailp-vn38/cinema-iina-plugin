import { useEffect, useRef } from "react";
import { useAppStore } from "./store/appStore.js";
import { useRuntimeBridge } from "./hooks/useRuntimeBridge.js";
import { useCatalogActions } from "./hooks/useCatalogActions.js";
import { Header } from "./components/layout/Header.jsx";
import { SourceSelector } from "./components/source/SourceSelector.jsx";
import { CatalogView } from "./components/catalog/CatalogView.jsx";

export default function App() {
  useRuntimeBridge();

  const sources = useAppStore((state) => state.sources);
  const activeSourceId = useAppStore((state) => state.activeSourceId);
  const setActiveSource = useAppStore((state) => state.setActiveSource);
  const catalog = useAppStore((state) => state.catalog);
  const status = useAppStore((state) => state.status);

  const { loadHome, loadMore } = useCatalogActions();
  const appShellRef = useRef(null);
  const lastScrollRef = useRef(0);

  // Load catalog home on mount
  useEffect(() => {
    console.log("[App] Component mounted, triggering initial loadHome");
    loadHome();
  }, []);

  // Load catalog home when source changes
  useEffect(() => {
    console.log("[App] activeSourceId changed to:", activeSourceId);
    loadHome();
  }, [activeSourceId, loadHome]);

  // Pull-to-refresh handler
  useEffect(() => {
    const handleScroll = (e) => {
      const scrollTop = e.target.scrollTop;
      const delta = scrollTop - lastScrollRef.current;
      lastScrollRef.current = scrollTop;

      // Detect pull-to-refresh: scrolling down near top
      if (scrollTop <= 0 && delta < -5) {
        console.log("[App] Pull-to-refresh detected, reloading...");
        loadHome();
      }
    };

    const container = appShellRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [loadHome]);

  console.log("[App] Rendering, catalog items:", catalog.items.length);

  return (
    <main className="app-shell" ref={appShellRef}>
      <Header />

      {status === "loading" && (
        <div
          style={{
            padding: "12px",
            textAlign: "center",
            color: "var(--accent)",
            fontSize: "12px",
            fontWeight: "600",
          }}
        >
          ⟳ Đang cập nhật...
        </div>
      )}

      <SourceSelector
        sources={sources}
        activeSourceId={activeSourceId}
        onChange={setActiveSource}
      />

      <CatalogView
        title={catalog.title}
        subtitle={catalog.subtitle}
        items={catalog.items}
        sourceId={catalog.sourceId}
        pagination={catalog.pagination}
        onLoadMore={loadMore}
        isLoading={status === "loading"}
      />
    </main>
  );
}
