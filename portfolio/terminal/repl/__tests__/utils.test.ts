import { QUESTIONS } from '@terminal/questions';
import type { HistoryItem } from '@terminal/history/types';

import { commandHistory, navigate } from '../utils';

const PROMPT = 'C:\\Users\\connor>';

function typed(line: string, prompt = PROMPT): HistoryItem {
  return { type: 'command', line, prompt };
}

describe('commandHistory', () => {
  test('keeps typed commands, oldest first', () => {
    expect(commandHistory([typed('help'), typed('whoami')])).toEqual(['help', 'whoami']);
  });

  test('skips answers to questions, ^C lines, blank lines, and repeats in a row', () => {
    const items: HistoryItem[] = [
      typed('help'),
      typed('connor', QUESTIONS.identify.text),
      typed('Y', QUESTIONS.retryChat.text),
      typed('1', QUESTIONS.askExample.text),
      { type: 'command', line: 'half typed', prompt: PROMPT, interrupted: true },
      typed('   '),
      typed('help'),
      { type: 'text', text: 'not a command' },
      typed('whoami'),
      typed('help'),
    ];

    expect(commandHistory(items)).toEqual(['help', 'whoami', 'help']);
  });
});

describe('navigate', () => {
  const lines = ['help', 'whoami', 'contact'];

  test('Up from a fresh line starts at the newest command and keeps the draft', () => {
    expect(navigate(lines, null, 'up', 'dra')).toEqual({
      recall: { index: 2, draft: 'dra' },
      value: 'contact',
    });
  });

  test('Up stops at the oldest command', () => {
    const step = navigate(lines, { index: 0, draft: 'dra' }, 'up', 'help');

    expect(step).toEqual({ recall: { index: 0, draft: 'dra' }, value: 'help' });
  });

  test('Down moves to a newer command, then restores the draft past the newest', () => {
    const toNewer = navigate(lines, { index: 1, draft: 'dra' }, 'down', 'whoami');
    expect(toNewer).toEqual({ recall: { index: 2, draft: 'dra' }, value: 'contact' });

    expect(navigate(lines, toNewer.recall, 'down', toNewer.value)).toEqual({
      recall: null,
      value: 'dra',
    });
  });

  test('Down on a fresh line and Up with no history change nothing', () => {
    expect(navigate(lines, null, 'down', 'dra')).toEqual({ recall: null, value: 'dra' });
    expect(navigate([], null, 'up', 'dra')).toEqual({ recall: null, value: 'dra' });
  });
});
