import { CallbackFn, UnregisterFn, EventBus } from "./types";

export function createEventBus<TMap extends Record<string, unknown>>(): EventBus<TMap> {
  const handlers = new Map<string, CallbackFn[]>();

  function on<K extends keyof TMap>(eventName: K, callback: (payload: TMap[K]) => void): UnregisterFn {
    const key = eventName as string;
    const eventHandlers = handlers.get(key) ?? [];
    eventHandlers.push(callback as CallbackFn);
    handlers.set(key, eventHandlers);
    return () => off(eventName, callback);
  }

  function off<K extends keyof TMap>(eventName: K, callback: (payload: TMap[K]) => void) {
    const key = eventName as string;
    const eventHandlers = handlers.get(key);
    if (eventHandlers) {
      eventHandlers.splice(eventHandlers.indexOf(callback as CallbackFn) >>> 0, 1);
    }
  }

  function emit<K extends keyof TMap>(eventName: K, payload: TMap[K]) {
    const key = eventName as string;
    const eventHandlers = handlers.get(key);
    if (eventHandlers) {
      eventHandlers.slice().forEach(async (handler) => {
        await handler(payload);
      });
    }
  }

  return { on, off, emit };
}
