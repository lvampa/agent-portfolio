import { Link } from '@components/ui/link';
import React from 'react';

import type { HistoryItemOf } from '../types';

export const LinkLine: React.FC<{ item: HistoryItemOf<'link'> }> = ({ item }) => (
  <div>
    <p>
      {item.text}
      <Link href={item.href}>{item.label}</Link>
    </p>
  </div>
);
