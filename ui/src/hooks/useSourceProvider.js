import { useMemo } from "react";
import { getProvider } from "../providers/registry.js";
import { useAppStore } from "../store/appStore.js";

export function useSourceProvider() {
  const activeSourceId = useAppStore((state) => state.activeSourceId);

  return useMemo(() => getProvider(activeSourceId), [activeSourceId]);
}
