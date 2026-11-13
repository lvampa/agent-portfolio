import { hold, parseReply, replyLength, revealProgressAt } from '@terminal/history/utils';

describe('parseReply', () => {
  test('splits paragraphs and lists, and finds bold, links, and emails at contiguous offsets', () => {
    const reply = [
      'Hi [old](http://x.dev).',
      '',
      'See https://example.com.',
      '- **Bold** item',
      '* Mail c@d.io or [docs](https://d.dev)',
    ].join('\n');

    const blocks = parseReply(reply);

    expect(blocks).toEqual([
      { type: 'paragraph', spans: [{ type: 'text', text: 'Hi [old](http://x.dev).', offset: 0 }] },
      {
        type: 'paragraph',
        spans: [
          { type: 'text', text: 'See ', offset: 23 },
          { type: 'link', text: 'https://example.com', href: 'https://example.com', offset: 27 },
          { type: 'text', text: '.', offset: 46 },
        ],
      },
      {
        type: 'list',
        items: [
          [
            { type: 'bold', text: 'Bold', offset: 47 },
            { type: 'text', text: ' item', offset: 51 },
          ],
          [
            { type: 'text', text: 'Mail ', offset: 56 },
            { type: 'link', text: 'c@d.io', href: 'mailto:c@d.io', offset: 61 },
            { type: 'text', text: ' or ', offset: 67 },
            { type: 'link', text: 'docs', href: 'https://d.dev', offset: 71 },
          ],
        ],
      },
    ]);
    expect(replyLength(blocks)).toBe(75);
  });
});

describe('revealProgressAt', () => {
  test('holds, then streams at its rate, then is done after the total', () => {
    const steps = [hold(60), { type: 'stream' as const, length: 10, msPerChar: 4 }];

    expect(revealProgressAt(steps, 30)).toEqual({ step: 0, chars: 0, isDone: false });
    expect(revealProgressAt(steps, 81)).toEqual({ step: 1, chars: 5, isDone: false });
    expect(revealProgressAt(steps, 100)).toMatchObject({ step: 2, isDone: true });
  });
});
