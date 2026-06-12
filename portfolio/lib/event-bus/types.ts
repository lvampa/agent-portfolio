export type UnregisterFn = () => void;

export type CallbackFn<T = unknown> = (event?: T) => void | Promise<void>;

export interface EventBus<TMap extends Record<string, unknown>> {
  on<K extends string & keyof TMap>(eventName: K, fn: (payload: TMap[K]) => void): UnregisterFn;
  off<K extends string & keyof TMap>(eventName: K, fn: (payload: TMap[K]) => void): void;
  emit<K extends string & keyof TMap>(eventName: K, payload: TMap[K]): void;
}
