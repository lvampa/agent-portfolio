import './lib/env';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  assetPrefix: './',
  transpilePackages: ['@t3-oss/env-nextjs', '@t3-oss/env-core'],
};

export default nextConfig;
