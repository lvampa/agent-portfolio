import type { HistoryItem } from '@terminal/history/types';
import { QUESTIONS } from '@terminal/questions';

import type { Recall, RecallStep } from './types';

/** The lines typed at the command prompt, oldest first. Answers, ^C lines, blank lines, and repeats in a row are left out. */
export function commandHistory(items: HistoryItem[]): string[] {
  const answerPrompts = new Set(Object.values(QUESTIONS).map((question) => question.text));
  const lines: string[] = [];

  for (const item of items) {
    if (item.type !== 'command' || item.interrupted || answerPrompts.has(item.prompt)) continue;
    if (!item.line.trim() || item.line === lines.at(-1)) continue;
    lines.push(item.line);
  }
  return lines;
}

/**
 * Moves through `lines` like a shell. Up from a fresh line saves what was typed as the draft,
 * and Down past the newest line brings the draft back.
 */
export function navigate(
  lines: readonly string[],
  recall: Recall | null,
  direction: 'up' | 'down',
  value: string,
): RecallStep {
  if (direction === 'up') {
    if (lines.length === 0) return { recall, value };
    const index = recall ? Math.max(recall.index - 1, 0) : lines.length - 1;
    return { recall: { index, draft: recall?.draft ?? value }, value: lines[index] };
  }

  if (!recall) return { recall, value };
  if (recall.index >= lines.length - 1) return { recall: null, value: recall.draft };
  return { recall: { ...recall, index: recall.index + 1 }, value: lines[recall.index + 1] };
}
