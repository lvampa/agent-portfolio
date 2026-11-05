// jsdom has no matchMedia. Every query reports no match, so tests see full motion unless they spy on it.
// Node-environment tests such as nextConfig.test.ts have no window at all.
if (typeof window !== 'undefined') {
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
}
