import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import { UI_COMMANDS } from "@shared/contracts/commands";
import { iinaClient } from "../../bridge/iinaClient";
import { useAppStore } from "../../store/appStore";
import type { DiagnosticState, PlaybackState } from "../../store/types";

async function copyText(text: string): Promise<void> {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    navigator.clipboard.writeText
  ) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard API unavailable.");
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

interface DiagnosticPanelProps {
  diagnostic: DiagnosticState;
  status: string;
  message: string;
  view: string;
  lastEventName: string;
  runtimeEventCount: number;
  playback: PlaybackState;
}

export function DiagnosticPanel({
  diagnostic,
  status,
  message,
  view,
  lastEventName,
  runtimeEventCount,
  playback,
}: DiagnosticPanelProps): ReactElement {
  const [copyState, setCopyState] = useState("");
  const recordOutboundCommand = useAppStore(
    (state) => state.recordOutboundCommand,
  );

  function requestDiagnostic(): void {
    recordOutboundCommand(UI_COMMANDS.REQUEST_DIAGNOSTIC);
    iinaClient.post(UI_COMMANDS.REQUEST_DIAGNOSTIC, {
      requestId: "manual-diagnostic",
    });
  }

  const snapshot = useMemo(
    () => {
      const bridge = iinaClient.inspect();
      return {
      status,
      message,
      view,
      pluginVersion: diagnostic.pluginVersion || "",
      sidebarLoaded: Boolean(diagnostic.sidebarLoaded),
      windowLoaded: Boolean(diagnostic.windowLoaded),
      lastOutbound: diagnostic.lastOutboundCommand || "",
      lastUiMessage: diagnostic.lastUiMessage || "",
      lastAppMessage: diagnostic.lastAppMessage || "",
      lastEventName: lastEventName || "",
      runtimeEventCount,
      playStage: diagnostic.playStage || "",
      lastPlayRequestId: diagnostic.lastPlayRequestId || "",
      lastPlayMode: diagnostic.lastPlayMode || "",
      lastPlayTitle: diagnostic.lastPlayTitle || "",
      lastPlayEntryUrl: diagnostic.lastPlayEntryUrl || "",
      runtimeMode: diagnostic.runtimeMode || "",
      bridgePhase: diagnostic.bridgePhase || "",
      activePlayerLabel: diagnostic.activePlayerLabel || "",
      playerReady: Boolean(diagnostic.playerReady),
      pendingCommandName: diagnostic.pendingCommandName || "",
      playerWindowVisible: Boolean(diagnostic.playerWindowVisible),
      playerWindowMiniaturized: Boolean(diagnostic.playerWindowMiniaturized),
      playerWindowPip: Boolean(diagnostic.playerWindowPip),
      playerWindowFrame: diagnostic.playerWindowFrame || "",
      playerStatusUrl: diagnostic.playerStatusUrl || "",
      playerVideoWidth:
        typeof diagnostic.playerVideoWidth === "number"
          ? diagnostic.playerVideoWidth
          : 0,
      playerVideoHeight:
        typeof diagnostic.playerVideoHeight === "number"
          ? diagnostic.playerVideoHeight
          : 0,
      playerPaused: Boolean(diagnostic.playerPaused),
      playerIdle: Boolean(diagnostic.playerIdle),
      pendingPlayId: playback.pendingRequestId || "",
      playback: {
        active: Boolean(playback.active),
        detailSlug: playback.detailSlug || "",
        episodeIndex: playback.episodeIndex,
        episodeName: playback.episodeName || "",
        serverId: playback.serverId || "",
        url: playback.url || "",
      },
      lastError: diagnostic.lastError || "",
      bridgeSource: bridge.source,
      hasGlobalIdentifier: bridge.hasGlobalIdentifier,
      hasGlobalThisIina: bridge.hasGlobalThisIina,
      hasWindowIina: bridge.hasWindowIina,
    };
    },
    [
      diagnostic,
      lastEventName,
      message,
      playback,
      runtimeEventCount,
      status,
      view,
    ],
  );

  async function handleCopyJson(): Promise<void> {
    try {
      await copyText(JSON.stringify(snapshot, null, 2));
      setCopyState("copied");
      setTimeout(() => setCopyState(""), 1600);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState(""), 2000);
    }
  }

  const rows: Array<[string, string]> = [
    ["status", snapshot.status],
    ["message", snapshot.message],
    ["view", snapshot.view],
    ["pluginVersion", snapshot.pluginVersion],
    ["sidebarLoaded", snapshot.sidebarLoaded ? "yes" : "no"],
    ["windowLoaded", snapshot.windowLoaded ? "yes" : "no"],
    ["lastOutbound", snapshot.lastOutbound],
    ["lastUiMessage", snapshot.lastUiMessage],
    ["lastAppMessage", snapshot.lastAppMessage],
    ["lastEventName", snapshot.lastEventName],
    ["runtimeEventCount", String(snapshot.runtimeEventCount)],
    ["playStage", snapshot.playStage],
    ["lastPlayRequestId", snapshot.lastPlayRequestId],
    ["lastPlayMode", snapshot.lastPlayMode],
    ["lastPlayTitle", snapshot.lastPlayTitle],
    ["lastPlayEntryUrl", snapshot.lastPlayEntryUrl],
    ["runtimeMode", snapshot.runtimeMode],
    ["bridgePhase", snapshot.bridgePhase],
    ["activePlayerLabel", snapshot.activePlayerLabel],
    ["playerReady", snapshot.playerReady ? "yes" : "no"],
    ["pendingCommandName", snapshot.pendingCommandName],
    ["playerWindowVisible", snapshot.playerWindowVisible ? "yes" : "no"],
    ["playerWindowMiniaturized", snapshot.playerWindowMiniaturized ? "yes" : "no"],
    ["playerWindowPip", snapshot.playerWindowPip ? "yes" : "no"],
    ["playerWindowFrame", snapshot.playerWindowFrame],
    ["playerStatusUrl", snapshot.playerStatusUrl],
    ["playerVideoWidth", String(snapshot.playerVideoWidth)],
    ["playerVideoHeight", String(snapshot.playerVideoHeight)],
    ["playerPaused", snapshot.playerPaused ? "yes" : "no"],
    ["playerIdle", snapshot.playerIdle ? "yes" : "no"],
    ["bridgeSource", snapshot.bridgeSource],
    ["hasGlobalIdentifier", snapshot.hasGlobalIdentifier ? "yes" : "no"],
    ["hasGlobalThisIina", snapshot.hasGlobalThisIina ? "yes" : "no"],
    ["hasWindowIina", snapshot.hasWindowIina ? "yes" : "no"],
    ["pendingPlayId", snapshot.pendingPlayId],
    ["playback.active", snapshot.playback.active ? "yes" : "no"],
    ["playback.detailSlug", snapshot.playback.detailSlug],
    ["playback.episodeIndex", String(snapshot.playback.episodeIndex)],
    ["playback.episodeName", snapshot.playback.episodeName],
    ["playback.serverId", snapshot.playback.serverId],
    ["lastError", snapshot.lastError],
  ];

  return (
    <section className="panel diagnostic-panel">
      <div className="episode-section-header">
        <h2>Diagnostic</h2>
        <div className="diagnostic-actions">
          <button
            className="ghost-button ghost-button--small"
            type="button"
            onClick={handleCopyJson}
          >
            {copyState === "copied"
              ? "Copied"
              : copyState === "error"
                ? "Copy failed"
                : "Copy JSON"}
          </button>
          <button
            className="ghost-button ghost-button--small"
            type="button"
            onClick={requestDiagnostic}
          >
            Ping runtime
          </button>
        </div>
      </div>
      <div className="diagnostic-grid">
        {rows.map(([key, value]) => (
          <div className="diagnostic-row" key={key}>
            <span className="diagnostic-key">{key}</span>
            <span className="diagnostic-value">{value || "-"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
