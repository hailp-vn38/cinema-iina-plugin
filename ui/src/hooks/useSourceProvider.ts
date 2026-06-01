import { useMemo } from "react";
import { getProvider } from "../providers/registry";
import { useAppStore } from "../store/appStore";

export function useSourceProvider() {
  const activeSourceId = useAppStore((state) => state.activeSourceId);

  return useMemo(() => getProvider(activeSourceId), [activeSourceId]);
}
