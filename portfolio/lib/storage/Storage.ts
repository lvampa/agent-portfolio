import { type ZodType } from 'zod';

export class Storage {
  constructor(private key: string) {}

  load<T>(schema: ZodType<T>): T[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.flatMap((item: unknown) => {
        const result = schema.safeParse(item);
        return result.success ? [result.data] : [];
      });
    } catch {
      return [];
    }
  }

  append<T>(item: T): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(this.key);
      const existing: unknown = raw ? JSON.parse(raw) : [];
      const arr = Array.isArray(existing) ? existing : [];
      localStorage.setItem(this.key, JSON.stringify([...arr, item]));
    } catch {
      localStorage.setItem(this.key, JSON.stringify([item]));
    }
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.key);
  }
}
