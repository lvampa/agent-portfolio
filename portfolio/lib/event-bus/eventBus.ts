import { type CallbackFn, type EventBus, type UnregisterFn } from './types';

export function createEventBus<TMap extends Record<string, unknown>>(): EventBus<TMap> {
  const handlers = new Map<string, CallbackFn[]>();

  function on<K extends string & keyof TMap>(
    eventName: K,
    callback: (payload: TMap[K]) => void,
  ): UnregisterFn {
    const eventHandlers = handlers.get(eventName) ?? [];
    const cb = callback as CallbackFn;

    if (eventHandlers.includes(cb)) {
      return () => off(eventName, callback);
    }

    eventHandlers.push(cb);
    handlers.set(eventName, eventHandlers);
    return () => off(eventName, callback);
  }

  function off<K extends string & keyof TMap>(
    eventName: K,
    callback: (payload: TMap[K]) => void,
  ): void {
    const eventHandlers = handlers.get(eventName);

    if (eventHandlers) {
      eventHandlers.splice(eventHandlers.indexOf(callback as CallbackFn) >>> 0, 1);
    }
  }

  function emit<K extends string & keyof TMap>(eventName: K, payload: TMap[K]): void {
    const eventHandlers = handlers.get(eventName);

    if (eventHandlers) {
      eventHandlers.slice().forEach(async (handler) => {
        await handler(payload);
      });
    }
  }

  return { on, off, emit };
}
