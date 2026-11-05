/**
 * @jest-environment node
 */
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from 'next/constants';

const DEV_INFO_URL = 'https://info.example.com/';

// next.config reads env at load, so each test loads it fresh. Node, because server vars throw in jsdom.
const loadConfig = async () => (await import('../../next.config')).default;

describe('next.config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env.DEV_INFO_URL = DEV_INFO_URL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('the build never rewrites, because a static export cannot', async () => {
    const nextConfig = await loadConfig();
    expect(nextConfig(PHASE_PRODUCTION_BUILD).rewrites).toBeUndefined();
  });

  test('the dev server rewrites /info to DEV_INFO_URL', async () => {
    const nextConfig = await loadConfig();
    const rewrites = await nextConfig(PHASE_DEVELOPMENT_SERVER).rewrites?.();
    expect(rewrites).toEqual([{ source: '/info', destination: DEV_INFO_URL }]);
  });
});
