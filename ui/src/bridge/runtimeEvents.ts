import type { RuntimeEventName } from "@shared/contracts/events";
import { RUNTIME_EVENTS } from "@shared/contracts/events";
import { iinaClient } from "./iinaClient";

export interface RuntimeEventLog {
  eventName: RuntimeEventName;
  payload: unknown;
}

export function registerRuntimeEventLogger(
  onEvent: (event: RuntimeEventLog) => void,
): void {
  Object.values(RUNTIME_EVENTS).forEach((eventName) => {
    iinaClient.on(eventName, (payload) => {
      onEvent({
        eventName,
        payload,
      });
    });
  });
}
