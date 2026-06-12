import { z } from 'zod';

import { Storage } from '../Storage';

const itemSchema = z.object({ id: z.number() });

describe('Storage', () => {
  let storage: Storage;

  beforeEach(() => {
    localStorage.clear();
    storage = new Storage('test-key');
  });

  describe('load', () => {
    test('returns empty array when nothing is stored', () => {
      expect(storage.load(itemSchema)).toEqual([]);
    });

    test('returns parsed items that match the schema', () => {
      localStorage.setItem('test-key', JSON.stringify([{ id: 1 }, { id: 2 }]));
      expect(storage.load(itemSchema)).toEqual([{ id: 1 }, { id: 2 }]);
    });

    test('drops items that fail schema validation', () => {
      localStorage.setItem('test-key', JSON.stringify([{ id: 1 }, { id: 'bad' }, { id: 3 }]));
      expect(storage.load(itemSchema)).toEqual([{ id: 1 }, { id: 3 }]);
    });

    test('returns empty array when stored value is invalid JSON', () => {
      localStorage.setItem('test-key', 'not-json');
      expect(storage.load(itemSchema)).toEqual([]);
    });

    test('returns empty array when stored value is not an array', () => {
      localStorage.setItem('test-key', JSON.stringify({ id: 1 }));
      expect(storage.load(itemSchema)).toEqual([]);
    });
  });

  describe('append', () => {
    test('stores first item as single-element array', () => {
      storage.append({ id: 1 });
      expect(storage.load(itemSchema)).toEqual([{ id: 1 }]);
    });

    test('appends to existing items', () => {
      storage.append({ id: 1 });
      storage.append({ id: 2 });
      expect(storage.load(itemSchema)).toEqual([{ id: 1 }, { id: 2 }]);
    });

    test('does not mix keys across separate Storage instances', () => {
      const other = new Storage('other-key');
      storage.append({ id: 1 });
      other.append({ id: 99 });
      expect(storage.load(itemSchema)).toEqual([{ id: 1 }]);
      expect(other.load(itemSchema)).toEqual([{ id: 99 }]);
    });
  });

  describe('clear', () => {
    test('removes stored data for this key', () => {
      storage.append({ id: 1 });
      storage.clear();
      expect(storage.load(itemSchema)).toEqual([]);
    });

    test('does not affect other Storage instances', () => {
      const other = new Storage('other-key');
      storage.append({ id: 1 });
      other.append({ id: 99 });
      storage.clear();
      expect(storage.load(itemSchema)).toEqual([]);
      expect(other.load(itemSchema)).toEqual([{ id: 99 }]);
    });

    test('is safe to call when key is already absent', () => {
      expect(() => storage.clear()).not.toThrow();
      expect(storage.load(itemSchema)).toEqual([]);
    });
  });
});
