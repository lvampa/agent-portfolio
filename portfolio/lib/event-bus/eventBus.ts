import { type EventBus, type UnregisterFn } from './types';

export function createEventBus<TMap extends Record<string, unknown>>(): EventBus<TMap> {
  const handlers: { [K in keyof TMap]?: Set<(payload: TMap[K]) => void> } = {};

  function on<K extends string & keyof TMap>(
    eventName: K,
    callback: (payload: TMap[K]) => void,
  ): UnregisterFn {
    const eventHandlers = handlers[eventName] ?? new Set();
    eventHandlers.add(callback);
    handlers[eventName] = eventHandlers;
    return () => {
      eventHandlers.delete(callback);
    };
  }

  function emit<K extends string & keyof TMap>(eventName: K, payload: TMap[K]): void {
    // A copy, so a handler that unregisters another during emit does not skip it.
    [...(handlers[eventName] ?? [])].forEach((handler) => handler(payload));
  }

  return { on, emit };
}
