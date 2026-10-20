# Zod Type Safety & React Cleanup — Design Spec

## Goal

Add Zod runtime validation at all external data boundaries (API responses, localStorage), tighten TypeScript types to use `z.infer<>` as the single source of truth, and fix React anti-patterns identified in the current codebase.

## Architecture

Zod schemas live in `schemas.ts` files collocated alongside each module's `types.ts`. Plain TypeScript interfaces are replaced with `z.infer<typeof Schema>` types. At every system boundary — HTTP API response, localStorage read, component-level JSON parse — we call `.safeParse()` and handle failure gracefully (log + fallback, never throw into render). React issues are fixed in the same pass.

## Schema Files (new)

### `portfolio/lib/hooks/schemas.ts`
- `ClientInfoRequestSchema` — validates the infoClient GET response. All fields optional or nullable to match the existing interface (ip, country, city, latitude, longitude, asn, organization, timezone, deviceType, userAgent, acceptLanguage, acceptEncoding, referer, tlsVersion, tlsCipher, timestamp).
- `ChatResponseItemSchema` — `z.object({ output: z.string() })`
- `ChatResponseSchema` — `z.array(ChatResponseItemSchema)`

### `portfolio/lib/utils/schemas.ts`
- `ParsedUASchema` — mirrors `ParsedUA` interface (ua, browser, os, device, engine, cpu with optional sub-fields)
- `UserInfoItemSchema` — `z.object({ label: z.string(), value: z.string() })`
- `UserInfoSchema` — `z.array(UserInfoItemSchema)`

### `portfolio/app/components/History/schemas.ts`
- `HistoryItemTypeSchema` — `z.enum(['thinking', 'command', 'message', 'help', 'user'])`
- `HistoryItemSchema` — `z.object({ value: z.string(), type: HistoryItemTypeSchema, animate: z.boolean().optional() })`

## Types Updated

- `portfolio/lib/hooks/types.ts` — `ClientInfoRequest` replaced with `z.infer<typeof ClientInfoRequestSchema>`. `UseChat.sendMessage` return type updated to `Promise<ChatResponse | undefined>`. Dead `data: unknown` field removed from `UseChat`.
- `portfolio/lib/utils/types.ts` — `ParsedUA`, `UserInfo`, `UserInfoItem` replaced with inferred types.
- `portfolio/app/components/History/types.ts` — `HistoryItem` and `HistoryItemType` replaced with inferred types.

## Boundary Call Sites Updated

### `portfolio/lib/hooks/useClientInfo.ts`
- `ClientInfoRequestSchema.safeParse(response.data)` — on failure, sets `request` to `null` and logs a warning. 
- Merge two `useEffect` calls into one (`getParsedUA` is synchronous, can run in the same effect as the fetch setup).

### `portfolio/lib/storage/Storage.ts`
- `load<T>()` signature changes to `load<T>(schema: ZodType<T>): T[]`
- After `JSON.parse`, calls `schema.safeParse()` on each item; silently drops invalid items.

### `portfolio/app/contexts/HistoryContext.tsx`
- Passes `HistoryItemSchema` to `storage.load(HistoryItemSchema)`.

### `portfolio/app/components/Repl/Repl.tsx`
- Replaces manual `Array.isArray(result)` + `'output' in item` checks with `ChatResponseSchema.safeParse(result)`.
- Adds `eventBus` to `useEffect` deps array (was missing).

### `portfolio/app/components/History/renderers/User.tsx`
- Replaces bare `JSON.parse(item.value)` with `UserInfoSchema.safeParse(JSON.parse(item.value))` — renders `null` on parse failure instead of throwing.

### `portfolio/lib/hooks/useChat.ts`
- Removes dead `data` state and `setData` call.
- Return type uses `ChatResponse | undefined`.

## Error Handling

- API parse failure → `request: null` (infoClient). Warning logged.
- localStorage parse failure → invalid items silently dropped. Session restores what it can.
- Component parse failure (`User.tsx`) → returns `null` (renders nothing).
- Chat response parse failure → no messages appended, warning logged. Does not set error state (network succeeded; shape mismatch is a dev-time signal, not a user-facing error).

## Testing

Each schema tested independently in colocated `__tests__/` files:
- `lib/hooks/__tests__/schemas.test.ts` — valid + invalid ClientInfoRequest, ChatResponse
- `lib/utils/__tests__/schemas.test.ts` — valid + invalid ParsedUA, UserInfo
- `app/components/History/__tests__/schemas.test.ts` — valid + invalid HistoryItem, unknown type value

Existing tests (`HistoryContext.test.tsx`, `storage.test.ts`) updated to pass `HistoryItemSchema` to `storage.load()`.

## Out of Scope

- `ParsedUA` from ua-parser-js: validated but not strictly enforced (library is internal and trusted)
- Zod coercion for `latitude`/`longitude` (currently `string | number`): keep as-is, coerce with `z.coerce.number()` only if API sends strings
