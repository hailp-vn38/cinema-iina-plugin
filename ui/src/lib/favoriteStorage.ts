import type { FavoriteEntry } from "../store/types";

const STORAGE_KEY = "iina-plugin-playlist-favorites-v1";
const LEGACY_HISTORY_STORAGE_KEY = "iina-plugin-playlist-history-v1";

export function loadFavoriteEntries(): FavoriteEntry[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }

  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ||
      window.localStorage.getItem(LEGACY_HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as FavoriteEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveFavoriteEntries(entries: FavoriteEntry[]): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries || []));
  } catch {
    // Ignore quota/persistence errors in webview storage.
  }
}
