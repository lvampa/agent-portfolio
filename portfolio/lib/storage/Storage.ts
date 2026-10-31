import { type ZodType } from 'zod';

import { MAX_STORED_ITEMS } from './constants';

export class Storage {
  constructor(private key: string) {}

  load<T>(schema: ZodType<T>): T[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.slice(-MAX_STORED_ITEMS).flatMap((item: unknown) => {
        const result = schema.safeParse(item);
        return result.success ? [result.data] : [];
      });
    } catch {
      return [];
    }
  }

  append<T>(item: T): void {
    if (typeof window === 'undefined') return;
    const stored = this.readRaw();
    const next = [...stored, item].slice(-MAX_STORED_ITEMS);
    this.write(next);
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(this.key);
    } catch {
      // Storage is unavailable (private mode or blocked); there is nothing to clear.
    }
  }

  private readRaw(): unknown[] {
    try {
      const raw = localStorage.getItem(this.key);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private write(items: unknown[]): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(items));
    } catch {
      // Quota or private mode. History still works in memory, so losing persistence is acceptable.
    }
  }
}
