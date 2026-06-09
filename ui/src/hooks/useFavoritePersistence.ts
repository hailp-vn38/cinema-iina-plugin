import { useEffect, useRef } from "react";
import { loadFavoriteEntries, saveFavoriteEntries } from "../lib/favoriteStorage";
import { useAppStore } from "../store/appStore";

export function useFavoritePersistence(): void {
  const favorites = useAppStore((state) => state.favorites);
  const hydrateFavorites = useAppStore((state) => state.hydrateFavorites);
  const hydratedRef = useRef(false);
  const initialPersistSkippedRef = useRef(false);

  useEffect(() => {
    hydrateFavorites(loadFavoriteEntries());
    hydratedRef.current = true;
  }, [hydrateFavorites]);

  useEffect(() => {
    if (!hydratedRef.current) {
      return;
    }

    if (!initialPersistSkippedRef.current) {
      initialPersistSkippedRef.current = true;
      return;
    }

    saveFavoriteEntries(favorites);
  }, [favorites]);
}
