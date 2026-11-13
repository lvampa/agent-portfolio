import { REVEALED } from './constants';
import type {
  BlockSource,
  HistoryItem,
  ReplyBlock,
  ReplySpan,
  RevealProgress,
  RevealStep,
  UnplacedSpan,
} from './types';

export function hold(ms: number): RevealStep {
  return { type: 'hold', ms };
}

export function stream(length: number, msPerChar: number): RevealStep {
  return { type: 'stream', length, msPerChar };
}

function stepDuration(step: RevealStep): number {
  return step.type === 'hold' ? step.ms : step.length * step.msPerChar;
}

/** Elapsed time is measured, not counted in ticks, so the rate holds when the browser clamps timers. */
export function revealProgressAt(steps: RevealStep[], elapsedMs: number): RevealProgress {
  let remaining = elapsedMs;
  for (const [index, step] of steps.entries()) {
    const duration = stepDuration(step);
    if (remaining < duration) {
      const chars = step.type === 'stream' ? Math.floor(remaining / step.msPerChar) : 0;
      return { step: index, chars, isDone: false };
    }
    remaining -= duration;
  }
  return { ...REVEALED, step: steps.length };
}

export function hasReachedStep(progress: RevealProgress, step: number): boolean {
  return progress.isDone || progress.step >= step;
}

/** Characters shown of a stream of `length` that starts `offset` characters into the step's stream. */
export function shownChars(
  progress: RevealProgress,
  step: number,
  length: number,
  offset = 0,
): number {
  if (progress.isDone || progress.step > step) return length;
  if (progress.step < step) return 0;
  return Math.min(Math.max(progress.chars - offset, 0), length);
}

/** The first item from `from` that has something to reveal. Items with no steps never hold the cursor. */
export function firstUnrevealed(
  items: HistoryItem[],
  from: number,
  stepsFor: (item: HistoryItem) => RevealStep[],
): number {
  let index = from;
  while (index < items.length && stepsFor(items[index]).length === 0) index++;
  return index;
}

const LIST_LINE = /^\s*[-*] /;

// Markdown links, bold, bare URLs, and emails. Only https links, so no other scheme becomes clickable.
const INLINE_TOKEN =
  /\[([^\]\n]+)\]\((https:\/\/[^\s)]+)\)|\*\*([^*\n]+?)\*\*|(https:\/\/[^\s<>]+)|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g;
const TRAILING_PUNCTUATION = /[.,;:!?)\]'"]+$/;

function inlineSpans(text: string): UnplacedSpan[] {
  const spans: UnplacedSpan[] = [];
  let plain = '';
  let last = 0;

  const flushPlain = () => {
    if (plain) spans.push({ type: 'text', text: plain });
    plain = '';
  };

  for (const match of text.matchAll(INLINE_TOKEN)) {
    const [token, label, labelHref, bold, url, email] = match;
    plain += text.slice(last, match.index);
    last = match.index + token.length;

    if (label !== undefined) {
      flushPlain();
      spans.push({ type: 'link', text: label, href: labelHref });
    } else if (bold !== undefined) {
      flushPlain();
      spans.push({ type: 'bold', text: bold });
    } else if (url !== undefined) {
      const trailing = url.match(TRAILING_PUNCTUATION)?.[0] ?? '';
      const href = url.slice(0, url.length - trailing.length);
      flushPlain();
      spans.push({ type: 'link', text: href, href });
      plain += trailing;
    } else {
      flushPlain();
      spans.push({ type: 'link', text: email, href: `mailto:${email}` });
    }
  }
  plain += text.slice(last);
  flushPlain();
  return spans;
}

// Lines are checked one at a time, so a list can follow its lead-in line without a blank line.
function blockSources(text: string): BlockSource[] {
  const sources: BlockSource[] = [];
  let startsBlock = true;

  for (const line of text.split('\n')) {
    if (!line.trim()) {
      startsBlock = true;
      continue;
    }
    const isListLine = LIST_LINE.test(line);
    const type: BlockSource['type'] = isListLine ? 'list' : 'paragraph';
    const last = sources.at(-1);
    const current: BlockSource = !startsBlock && last?.type === type ? last : { type, lines: [] };
    if (current !== last) sources.push(current);
    current.lines.push(isListLine ? line.replace(LIST_LINE, '') : line);
    startsBlock = false;
  }
  return sources;
}

/** Splits a reply into paragraphs and lists of spans, each span tagged with its stream offset. */
export function parseReply(text: string): ReplyBlock[] {
  let offset = 0;
  const withOffsets = (spans: UnplacedSpan[]): ReplySpan[] =>
    spans.map((span) => {
      const placed = { ...span, offset } as ReplySpan;
      offset += span.text.length;
      return placed;
    });

  return blockSources(text).map((source) =>
    source.type === 'list'
      ? { type: 'list', items: source.lines.map((line) => withOffsets(inlineSpans(line))) }
      : { type: 'paragraph', spans: withOffsets(inlineSpans(source.lines.join('\n'))) },
  );
}

export function replyLength(blocks: ReplyBlock[]): number {
  const spans = blocks.flatMap((block) =>
    block.type === 'list' ? block.items.flat() : block.spans,
  );
  const last = spans.at(-1);
  return last ? last.offset + last.text.length : 0;
}
