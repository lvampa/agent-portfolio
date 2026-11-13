import { Storage } from '@lib/storage';
import { HistoryItemSchema } from '@terminal/history/schemas';

describe('HistoryItemSchema', () => {
  test('drops an invalid stored item and keeps the valid ones', () => {
    const valid = [
      { type: 'text', text: '' },
      { type: 'command', line: 'help', prompt: 'C:\\Users\\unknown>' },
      {
        type: 'clientInfo',
        info: [{ label: 'ip', value: '127.0.0.1' }],
        prompt: 'C:\\Users\\unknown>',
      },
      { type: 'list', items: [{ term: 'help, h', detail: 'List the commands.' }] },
      { type: 'link', text: 'Portfolio: ', label: 'example.com', href: 'https://example.com' },
    ];
    // The old string-value shape, which no longer validates.
    const invalid = { type: 'command', value: 'help' };
    localStorage.setItem('history-test', JSON.stringify([valid[0], invalid, ...valid.slice(1)]));

    expect(new Storage('history-test').load(HistoryItemSchema)).toEqual(valid);
  });

  test('rejects a link item whose href is not https', () => {
    const link = { type: 'link', text: 'Portfolio: ', label: 'example.com' };

    expect(HistoryItemSchema.safeParse({ ...link, href: 'http://example.com' }).success).toBe(
      false,
    );
    expect(HistoryItemSchema.safeParse({ ...link, href: 'javascript:alert(1)' }).success).toBe(
      false,
    );
  });
});
