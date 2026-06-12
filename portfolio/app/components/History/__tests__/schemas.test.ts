import { HISTORY_ITEM_TYPES } from '@app/components/History/constants';
import { HistoryItemSchema, HistoryItemTypeSchema } from '@app/components/History/schemas';

describe('HistoryItemTypeSchema', () => {
  test('accepts valid item types', () => {
    Object.values(HISTORY_ITEM_TYPES).forEach((type) => {
      expect(HistoryItemTypeSchema.safeParse(type).success).toBe(true);
    });
  });

  test('rejects unknown type', () => {
    expect(HistoryItemTypeSchema.safeParse('unknown').success).toBe(false);
  });
});

describe('HistoryItemSchema', () => {
  test('accepts valid history item', () => {
    expect(
      HistoryItemSchema.safeParse({ value: 'hello', type: 'command' }).success,
    ).toBe(true);
  });

  test('accepts item with animate flag', () => {
    expect(
      HistoryItemSchema.safeParse({ value: 'hi', type: 'message', animate: true }).success,
    ).toBe(true);
  });

  test('rejects item with unknown type', () => {
    expect(
      HistoryItemSchema.safeParse({ value: 'hi', type: 'bogus' }).success,
    ).toBe(false);
  });

  test('rejects item missing value', () => {
    expect(HistoryItemSchema.safeParse({ type: 'command' }).success).toBe(false);
  });
});
