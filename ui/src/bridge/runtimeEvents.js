import { RUNTIME_EVENTS } from "@shared/contracts/events.js";
import { iinaClient } from "./iinaClient.js";

export function registerRuntimeEventLogger(onEvent) {
  Object.values(RUNTIME_EVENTS).forEach((eventName) => {
    iinaClient.on(eventName, (payload) => {
      onEvent({
        eventName,
        payload,
      });
    });
  });
}
