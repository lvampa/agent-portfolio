export class Storage {
  constructor(private key: string) {}

  load<T>(): T[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  append<T>(item: T): void {
    if (typeof window === "undefined") return;
    const current = this.load<T>();
    localStorage.setItem(this.key, JSON.stringify([...current, item]));
  }

  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.key);
  }
}
