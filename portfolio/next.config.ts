import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

import { env } from './lib/env';

const baseConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  assetPrefix: './',
  transpilePackages: ['@t3-oss/env-nextjs', '@t3-oss/env-core'],
};

// Only the dev server rewrites, because a static export cannot.
// The deployed site gets /info from the Worker route, and without DEV_INFO_URL dev runs without client info.
export default function nextConfig(phase: string): NextConfig {
  const devInfoUrl = env.DEV_INFO_URL;
  if (phase !== PHASE_DEVELOPMENT_SERVER || !devInfoUrl) return baseConfig;

  return {
    ...baseConfig,
    rewrites: async () => [{ source: '/info', destination: devInfoUrl }],
  };
}
