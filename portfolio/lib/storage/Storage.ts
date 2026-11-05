import { type ZodType } from 'zod';

import { MAX_STORED_ITEMS } from './constants';

export class Storage {
  constructor(
    private key: string,
    private legacyKeys: readonly string[] = [],
  ) {}

  load<T>(schema: ZodType<T>): T[] {
    if (typeof window === 'undefined') return [];
    this.removeLegacyKeys();
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

  loadValue<T>(schema: ZodType<T>): T | null {
    if (typeof window === 'undefined') return null;
    this.removeLegacyKeys();
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return null;
      const result = schema.safeParse(JSON.parse(raw));
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }

  save<T>(value: T): void {
    if (typeof window === 'undefined') return;
    this.write(value);
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

  // Old formats are dropped unread, so a stale shape can never reach the schema.
  private removeLegacyKeys(): void {
    try {
      this.legacyKeys.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Storage is unavailable; there is nothing to remove.
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

  private write(value: unknown): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(value));
    } catch {
      // Quota or private mode. History still works in memory, so losing persistence is acceptable.
    }
  }
}
