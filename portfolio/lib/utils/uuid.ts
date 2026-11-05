/** A v4 UUID. crypto.randomUUID exists only in secure contexts, so plain-http dev on the LAN uses getRandomValues. */
export function randomUuid(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16)).map((byte, index) => {
    if (index === 6) return (byte & 0x0f) | 0x40; // Version 4.
    if (index === 8) return (byte & 0x3f) | 0x80; // RFC 4122 variant.
    return byte;
  });
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
