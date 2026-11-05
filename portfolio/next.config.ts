import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

import { env } from './lib/env';

const baseConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  transpilePackages: ['@t3-oss/env-nextjs', '@t3-oss/env-core'],
  // The stylesheet is small, so inlining it saves a render-blocking request.
  experimental: { inlineCss: true },
};

// Only the dev server rewrites, because a static export cannot.
// The deployed site gets /info from the Worker route, and without DEV_INFO_URL dev runs without client info.
// Next warns at dev start that rewrites do not work with output: export; the dev server still applies them.
export default function nextConfig(phase: string): NextConfig {
  const devInfoUrl = env.DEV_INFO_URL;
  if (phase !== PHASE_DEVELOPMENT_SERVER || !devInfoUrl) return baseConfig;

  return {
    ...baseConfig,
    rewrites: async () => [{ source: '/info', destination: devInfoUrl }],
  };
}
