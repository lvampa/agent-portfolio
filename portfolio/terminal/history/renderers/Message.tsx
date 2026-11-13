import { Link } from '@components/ui/link';
import React, { useMemo } from 'react';

import type { ReplyBlock, ReplySpan, RevealProgress } from '../types';
import { parseReply, shownChars } from '../utils';
import { StreamedText } from './StreamedText';
import type { RendererProps } from './types';

// A message has one stream step, so every span reads its characters from step 0.
function isReached(progress: RevealProgress, offset: number): boolean {
  return shownChars(progress, 0, 1, offset) > 0;
}

function Span({ span, progress }: { span: ReplySpan; progress: RevealProgress }) {
  const text = (
    <StreamedText text={span.text} chars={shownChars(progress, 0, span.text.length, span.offset)} />
  );
  switch (span.type) {
    case 'text':
      return text;
    case 'bold':
      return <strong className="bg-terminal text-background font-normal">{text}</strong>;
    case 'link': {
      // A mail link opens the mail app, so there is no terminal session to keep in a new tab.
      const target = span.href.startsWith('mailto:') ? '_self' : undefined;
      return (
        <Link href={span.href} target={target}>
          {text}
        </Link>
      );
    }
    default:
      return span satisfies never;
  }
}

function Spans({ spans, progress }: { spans: ReplySpan[]; progress: RevealProgress }) {
  return spans.map((span) => <Span key={span.offset} span={span} progress={progress} />);
}

function blockStart(block: ReplyBlock): number {
  const first = block.type === 'list' ? block.items.flat()[0] : block.spans[0];
  return first?.offset ?? 0;
}

function Block({ block, progress }: { block: ReplyBlock; progress: RevealProgress }) {
  if (block.type === 'paragraph') {
    return (
      <p className="whitespace-pre-wrap">
        <Spans spans={block.spans} progress={progress} />
      </p>
    );
  }
  return (
    <ul>
      {block.items.map((spans, index) => (
        // Items never reorder, so an index key stays stable.
        <li key={index} className="grid grid-cols-[2ch_minmax(0,1fr)]">
          <span aria-hidden>
            {spans.length === 0 || isReached(progress, spans[0].offset) ? '-' : ''}
          </span>
          <span>
            <Spans spans={spans} progress={progress} />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** The whole structure is built up front, so links and bold never reflow as the text streams in. */
export const Message: React.FC<RendererProps<'message'>> = ({ item, progress }) => {
  const blocks = useMemo(() => parseReply(item.text), [item.text]);

  return (
    <div className="flex flex-col gap-y-[1lh]">
      {blocks.map((block, index) => (
        // Blocks the stream has not reached are kept for screen readers, which get the whole reply at once.
        <div key={index} className={isReached(progress, blockStart(block)) ? undefined : 'sr-only'}>
          <Block block={block} progress={progress} />
        </div>
      ))}
    </div>
  );
};
