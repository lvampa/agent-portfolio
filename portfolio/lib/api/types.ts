/** Resolves to the parsed JSON body, which callers validate. Rejects on a network error, a timeout, or a non-2xx status. */
export interface ClientInterface {
  post(path: string, payload: unknown): Promise<unknown>;
  get(path: string): Promise<unknown>;
}
