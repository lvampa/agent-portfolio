import { z } from 'zod';

import { MAX_STORED_ITEMS } from '../constants';
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

    test('keeps only the newest items once the cap is exceeded', () => {
      for (let id = 1; id <= MAX_STORED_ITEMS + 5; id++) {
        storage.append({ id });
      }
      const stored = storage.load(itemSchema);
      expect(stored).toHaveLength(MAX_STORED_ITEMS);
      expect(stored[0]).toEqual({ id: 6 });
      expect(stored.at(-1)).toEqual({ id: MAX_STORED_ITEMS + 5 });
    });

    test('does not throw when setItem fails', () => {
      const spy = jest.spyOn(window.Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('quota', 'QuotaExceededError');
      });
      expect(() => storage.append({ id: 1 })).not.toThrow();
      spy.mockRestore();
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

    test('does not throw when removeItem fails', () => {
      const spy = jest.spyOn(window.Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      expect(() => storage.clear()).not.toThrow();
      spy.mockRestore();
    });

    test('is safe to call when key is already absent', () => {
      expect(() => storage.clear()).not.toThrow();
      expect(storage.load(itemSchema)).toEqual([]);
    });
  });

  describe('legacy keys', () => {
    test('removes the legacy key on load without reading it', () => {
      localStorage.setItem('legacy-key', JSON.stringify([{ id: 1 }]));
      const versioned = new Storage('test-key.v2', ['legacy-key']);

      expect(versioned.load(itemSchema)).toEqual([]);
      expect(localStorage.getItem('legacy-key')).toBeNull();
    });
  });

  describe('loadValue and save', () => {
    test('round-trips a single value', () => {
      storage.save({ id: 7 });
      expect(storage.loadValue(itemSchema)).toEqual({ id: 7 });
    });

    test('returns null when the stored value fails validation', () => {
      localStorage.setItem('test-key', JSON.stringify({ id: 'bad' }));
      expect(storage.loadValue(itemSchema)).toBeNull();
    });
  });
});
