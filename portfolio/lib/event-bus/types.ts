export type UnregisterFn = () => void;

export interface EventBus<TMap extends Record<string, unknown>> {
  on<K extends string & keyof TMap>(eventName: K, fn: (payload: TMap[K]) => void): UnregisterFn;
  emit<K extends string & keyof TMap>(eventName: K, payload: TMap[K]): void;
}
