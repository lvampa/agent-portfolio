import type { MetadataRoute } from 'next';

import { SITE_URL } from './constants';

// A static export can only emit metadata routes that are marked static.
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL }];
}
