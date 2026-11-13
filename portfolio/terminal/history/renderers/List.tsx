import React from 'react';

import { hasReachedStep } from '../utils';
import { Columns } from './Columns';
import type { RendererProps } from './types';

export const List: React.FC<RendererProps<'list'>> = ({ item, progress }) => (
  <Columns>
    {item.items.map((row, index) => {
      // Every row is laid out up front, so the columns never change width as rows appear.
      const className = hasReachedStep(progress, index) ? undefined : 'opacity-0';
      return (
        // Rows never reorder, so an index key stays stable.
        <React.Fragment key={index}>
          <dt className={className}>{row.term}</dt>
          <dd className={className}>{row.detail}</dd>
        </React.Fragment>
      );
    })}
  </Columns>
);
