import { useEffect, useRef } from "react";
import { loadHistoryEntries, saveHistoryEntries } from "../lib/historyStorage";
import { useAppStore } from "../store/appStore";

export function useHistoryPersistence(): void {
  const history = useAppStore((state) => state.history);
  const hydrateHistory = useAppStore((state) => state.hydrateHistory);
  const hydratedRef = useRef(false);
  const initialPersistSkippedRef = useRef(false);

  useEffect(() => {
    hydrateHistory(loadHistoryEntries());
    hydratedRef.current = true;
  }, [hydrateHistory]);

  useEffect(() => {
    if (!hydratedRef.current) {
      return;
    }

    if (!initialPersistSkippedRef.current) {
      initialPersistSkippedRef.current = true;
      return;
    }

    saveHistoryEntries(history);
  }, [history]);
}
