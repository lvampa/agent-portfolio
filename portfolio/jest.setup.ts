// jsdom lacks these browser APIs. Node-environment tests such as nextConfig.test.ts have no window at all.
if (typeof window !== 'undefined') {
  // Every query reports no match, so tests see full motion unless they spy on it.
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });

  // Tests mock fetch with jest.spyOn, so a real call fails loudly instead of reaching the network.
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    writable: true,
    value: () => Promise.reject(new Error('fetch is not mocked in this test')),
  });

  // No test waits out a request timeout, so the signal never aborts.
  Object.defineProperty(AbortSignal, 'timeout', {
    configurable: true,
    writable: true,
    value: () => new AbortController().signal,
  });
}
