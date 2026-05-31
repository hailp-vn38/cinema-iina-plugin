import { useEffect } from "react";
import { UI_COMMANDS } from "@shared/contracts/commands.js";
import { RUNTIME_EVENTS } from "@shared/contracts/events.js";
import { iinaClient } from "../bridge/iinaClient.js";
import { useAppStore } from "../store/appStore.js";

export function useRuntimeBridge() {
  const applyAppState = useAppStore((state) => state.applyAppState);
  const applyDiagnostic = useAppStore((state) => state.applyDiagnostic);
  const applyPlayResult = useAppStore((state) => state.applyPlayResult);
  const applyPlaybackState = useAppStore((state) => state.applyPlaybackState);
  const recordOutboundCommand = useAppStore(
    (state) => state.recordOutboundCommand,
  );
  const recordRuntimeEvent = useAppStore((state) => state.recordRuntimeEvent);

  useEffect(() => {
    iinaClient.on(RUNTIME_EVENTS.APP_STATE, (payload) => {
      applyAppState(payload);
    });

    iinaClient.on(RUNTIME_EVENTS.APP_DIAGNOSTIC, (payload) => {
      applyDiagnostic(payload);
    });

    iinaClient.on(RUNTIME_EVENTS.APP_PLAY_RESULT, (payload) => {
      applyPlayResult(payload);
      recordRuntimeEvent(RUNTIME_EVENTS.APP_PLAY_RESULT);
    });

    iinaClient.on(RUNTIME_EVENTS.APP_PLAYBACK_STATE, (payload) => {
      applyPlaybackState(payload);
      recordRuntimeEvent(RUNTIME_EVENTS.APP_PLAYBACK_STATE);
    });

    recordOutboundCommand(UI_COMMANDS.INIT);
    iinaClient.post(UI_COMMANDS.INIT, {
      ready: true,
    });

    recordOutboundCommand(UI_COMMANDS.REQUEST_DIAGNOSTIC);
    iinaClient.post(UI_COMMANDS.REQUEST_DIAGNOSTIC, {
      requestId: "phase-4-init",
    });
  }, [
    applyAppState,
    applyDiagnostic,
    applyPlayResult,
    applyPlaybackState,
    recordOutboundCommand,
    recordRuntimeEvent,
  ]);
}
