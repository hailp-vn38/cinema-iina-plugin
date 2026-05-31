import { COMMAND_MODEL_SHAPES, EVENT_MODEL_SHAPES } from "@shared/contracts/models.js";
import { DiagnosticPanel } from "./components/diagnostic/DiagnosticPanel.jsx";
import { CatalogView } from "./components/catalog/CatalogView.jsx";
import { CategoryChips } from "./components/catalog/CategoryChips.jsx";
import { SearchPanel } from "./components/catalog/SearchPanel.jsx";
import { Header } from "./components/layout/Header.jsx";
import { StatusPanel } from "./components/layout/StatusPanel.jsx";
import { SourceSelector } from "./components/source/SourceSelector.jsx";
import { useCatalogActions } from "./hooks/useCatalogActions.js";
import { useRuntimeBridge } from "./hooks/useRuntimeBridge.js";
import { useAppStore } from "./store/appStore.js";

export default function App() {
  useRuntimeBridge();
  const { loadCategory, search } = useCatalogActions();

  const sources = useAppStore((state) => state.sources);
  const activeSourceId = useAppStore((state) => state.activeSourceId);
  const setActiveSource = useAppStore((state) => state.setActiveSource);
  const status = useAppStore((state) => state.status);
  const message = useAppStore((state) => state.message);
  const connected = useAppStore((state) => state.connected);
  const lastEventName = useAppStore((state) => state.lastEventName);
  const runtimeEventCount = useAppStore((state) => state.runtimeEventCount);
  const diagnostic = useAppStore((state) => state.diagnostic);
  const catalog = useAppStore((state) => state.catalog);

  return (
    <main className="app-shell">
      <Header />

      <StatusPanel
        status={status}
        message={message}
        connected={connected}
        eventCount={runtimeEventCount}
        lastEventName={lastEventName}
      />

      <SourceSelector
        sources={sources}
        activeSourceId={activeSourceId}
        onChange={setActiveSource}
      />

      <SearchPanel onSearch={search} />

      <CategoryChips
        categories={catalog.categories}
        activeCategory={catalog.activeCategory}
        onSelect={loadCategory}
      />

      <section className="panel">
        <h2>Phase 6 Output</h2>
        <ul>
          <li>Home, category and search now run through provider actions</li>
          <li>Search form and category chips are connected to React state</li>
          <li>Source selector changes active provider and reloads catalog</li>
          <li>{Object.keys(COMMAND_MODEL_SHAPES).length} command model definitions</li>
          <li>{Object.keys(EVENT_MODEL_SHAPES).length} event model definitions</li>
        </ul>
      </section>

      <CatalogView
        title={catalog.title}
        subtitle={catalog.error || catalog.subtitle}
        items={catalog.items}
        sourceId={catalog.sourceId}
      />

      <DiagnosticPanel diagnostic={diagnostic} />
    </main>
  );
}
