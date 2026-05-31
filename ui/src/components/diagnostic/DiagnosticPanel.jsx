import { useMemo, useState } from "react";
import { UI_COMMANDS } from "@shared/contracts/commands.js";
import { iinaClient } from "../../bridge/iinaClient.js";
import { useAppStore } from "../../store/appStore.js";

async function copyText(text) {
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

export function DiagnosticPanel({
  diagnostic,
  status,
  message,
  view,
  lastEventName,
  runtimeEventCount,
  playback,
}) {
  const [copyState, setCopyState] = useState("");
  const recordOutboundCommand = useAppStore(
    (state) => state.recordOutboundCommand,
  );

  function requestDiagnostic() {
    recordOutboundCommand(UI_COMMANDS.REQUEST_DIAGNOSTIC);
    iinaClient.post(UI_COMMANDS.REQUEST_DIAGNOSTIC, {
      requestId: "manual-diagnostic",
    });
  }

  const snapshot = useMemo(
    () => ({
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
    }),
    [diagnostic, lastEventName, message, playback, runtimeEventCount, status, view],
  );

  async function handleCopyJson() {
    try {
      await copyText(JSON.stringify(snapshot, null, 2));
      setCopyState("copied");
      setTimeout(() => setCopyState(""), 1600);
    } catch (error) {
      setCopyState("error");
      setTimeout(() => setCopyState(""), 2000);
    }
  }

  const rows = [
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
        {rows.map(([key, value]) => {
          return (
            <div className="diagnostic-row" key={key}>
              <span className="diagnostic-key">{key}</span>
              <span className="diagnostic-value">{value || "-"}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
