import { randomUUID } from 'node:crypto';

// jsdom's crypto has no randomUUID, which browsers provide in secure contexts and the session id needs.
Object.defineProperty(globalThis.crypto, 'randomUUID', { value: randomUUID, configurable: true });
