import type { HistoryEntry } from "../store/types";

const STORAGE_KEY = "iina-plugin-playlist-history-v1";

export function loadHistoryEntries(): HistoryEntry[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveHistoryEntries(entries: HistoryEntry[]): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries || []));
  } catch {
    // Ignore quota/persistence errors in webview storage.
  }
}
