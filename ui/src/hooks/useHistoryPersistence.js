import { useEffect, useRef } from "react";
import { loadHistoryEntries, saveHistoryEntries } from "../lib/historyStorage.js";
import { useAppStore } from "../store/appStore.js";

export function useHistoryPersistence() {
  const history = useAppStore((state) => state.history);
  const hydrateHistory = useAppStore((state) => state.hydrateHistory);
  const hydratedRef = useRef(false);

  useEffect(() => {
    hydrateHistory(loadHistoryEntries());
    hydratedRef.current = true;
  }, [hydrateHistory]);

  useEffect(() => {
    if (!hydratedRef.current) {
      return;
    }

    saveHistoryEntries(history);
  }, [history]);
}
