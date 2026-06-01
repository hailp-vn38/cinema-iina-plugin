import { useEffect } from "react";
import type {
  AppDiagnosticPayload,
  AppPlaybackStatePayload,
  AppPlayResultPayload,
  AppStatePayload,
} from "@shared/contracts/models";
import { UI_COMMANDS } from "@shared/contracts/commands";
import { RUNTIME_EVENTS } from "@shared/contracts/events";
import { iinaClient } from "../bridge/iinaClient";
import { useAppStore } from "../store/appStore";

export function useRuntimeBridge(): void {
  const applyAppState = useAppStore((state) => state.applyAppState);
  const applyDiagnostic = useAppStore((state) => state.applyDiagnostic);
  const applyPlayResult = useAppStore((state) => state.applyPlayResult);
  const applyPlaybackState = useAppStore((state) => state.applyPlaybackState);
  const recordOutboundCommand = useAppStore(
    (state) => state.recordOutboundCommand,
  );

  useEffect(() => {
    iinaClient.on(RUNTIME_EVENTS.APP_STATE, (payload) => {
      applyAppState(payload as AppStatePayload);
    });

    iinaClient.on(RUNTIME_EVENTS.APP_DIAGNOSTIC, (payload) => {
      applyDiagnostic(payload as AppDiagnosticPayload);
    });

    iinaClient.on(RUNTIME_EVENTS.APP_PLAY_RESULT, (payload) => {
      applyPlayResult(payload as AppPlayResultPayload);
    });

    iinaClient.on(RUNTIME_EVENTS.APP_PLAYBACK_STATE, (payload) => {
      applyPlaybackState(payload as AppPlaybackStatePayload);
    });

    recordOutboundCommand(UI_COMMANDS.INIT);
    iinaClient.post(UI_COMMANDS.INIT, {
      ready: true,
    });

    recordOutboundCommand(UI_COMMANDS.REQUEST_DIAGNOSTIC);
    iinaClient.post(UI_COMMANDS.REQUEST_DIAGNOSTIC, {
      requestId: "phase-4-init",
    });

    function requestRuntimeSync(): void {
      recordOutboundCommand(UI_COMMANDS.REQUEST_RUNTIME_SYNC);
      iinaClient.post(UI_COMMANDS.REQUEST_RUNTIME_SYNC, {
        requestId: "runtime-sync-" + Date.now(),
      });
    }

    function handleVisibilityChange(): void {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        requestRuntimeSync();
      }
    }

    function handleWindowFocus(): void {
      requestRuntimeSync();
    }

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleWindowFocus);
    }

    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
      }

      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleWindowFocus);
      }
    };
  }, [
    applyAppState,
    applyDiagnostic,
    applyPlayResult,
    applyPlaybackState,
    recordOutboundCommand,
  ]);
}
