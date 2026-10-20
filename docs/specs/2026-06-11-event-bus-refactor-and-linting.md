# Event Bus Refactor + Linting

**Date:** 2026-06-11
**Branch:** feature/2_init-sequence

## Problem

The event bus is being used for two distinct purposes:

1. **Action triggers** — `SUBMIT` fires and `Repl` reacts. Correct use.
2. **State propagation** — `CHAT_RESULT`, `PAGE_LOAD`, `STORAGE_LOAD` broadcast history items to the `History` component. Misuse: the component reconstructs its state by catching events rather than reading from a single source of truth.

Symptoms:
- `buildUserInfoForUi` is called independently in both `History.tsx` and `useInitStorage.ts` for the same `PAGE_LOAD` event
- `History` has four `eventBus.on` subscriptions and no stable initial state
- Storage persistence is scattered across `useInitStorage` subscriptions

## Solution

### 1. HistoryContext

New file: `portfolio/app/contexts/HistoryContext.tsx`

Responsibilities:
- On mount: load `HistoryItem[]` from `storage.load()` — seeds returning visitors' sessions
- `append(item: HistoryItem)`: adds to React state and calls `storage.append(item)` immediately
- Provides: `{ items: HistoryItem[], append: (item: HistoryItem) => void }`

Wrap the app in `HistoryProvider` at the same level as `EventBusProvider` in `layout.tsx`.

### 2. Event bus after refactor

Remove from `EventMap` and `EVENTS`:
- `chat_result`
- `page_load`
- `storage_load`

Retained:
- `submit` — still the right tool for decoupled `InputForm` → `Repl` communication

### 3. File-by-file changes

| File | Change |
|------|--------|
| `app/contexts/HistoryContext.tsx` | **New** — owns items state + storage persistence |
| `app/hooks/useInitStorage.ts` | **Deleted** — logic absorbed into HistoryContext |
| `app/components/History/History.tsx` | Remove all `useEffect`/bus subscriptions; read `items` from context |
| `app/components/Repl/Repl.tsx` | On `SUBMIT`: call `historyContext.append(command)`, call API, call `historyContext.append(result)`; remove `CHAT_RESULT` emission |
| `app/page.tsx` | When `userInfo` loads and `items.length === 0`: call `historyContext.append(userInfoItem)`; remove `useInitStorage()` and `PAGE_LOAD` emission |
| `app/types/events.ts` | Remove `chat_result`, `page_load`, `storage_load` from `EventMap` |
| `app/constants/events.ts` | Remove `CHAT_RESULT`, `PAGE_LOAD`, `STORAGE_LOAD` from `EVENTS` |
| `app/layout.tsx` | Add `HistoryProvider`; remove `'use client'` directive (safe: Next.js App Router layouts can render Client Components without being one — both `EventBusProvider` and `HistoryProvider` declare `'use client'` in their own files) |

### 4. Session continuity

Returning visitors are handled by `HistoryContext` loading from storage on mount before any render. `page.tsx` checks `items.length === 0` before appending the user info item — so it only shows on a fresh session, not on every return visit.

---

## Linting

### New ESLint rules (added to `eslint.config.mjs`)

| Rule | Level | Reason |
|------|-------|--------|
| `@typescript-eslint/no-explicit-any` | error | No type escapes |
| `@typescript-eslint/consistent-type-imports` | error | `import type` for type-only imports |
| `@typescript-eslint/no-unused-vars` | error | Prefix `_` to intentionally ignore |
| `@typescript-eslint/naming-convention` | error | camelCase vars/params, PascalCase types/components, UPPER_CASE const enums |
| `no-console` | warn | No debug output in components |
| `eqeqeq` | error | `===` always |
| `simple-import-sort/imports` | error | Ordered: built-ins → externals → `@app/` `@lib/` → relative |
| `simple-import-sort/exports` | error | Consistent export ordering |

### New package

`eslint-plugin-simple-import-sort` (dev dependency)

### File structure convention (added to root CLAUDE.md)

- Types → `types.ts`
- Constants → `constants.ts`
- Pure utils → `utils.ts`
- No mixing — if a file grows to serve two purposes, split it

### JSDoc convention (added to root CLAUDE.md)

Document exported functions whose signature doesn't explain the why. Single-line `/** ... */` is enough. Skip self-evident wrappers.

---

## Verification

After implementation:
1. `npx tsc --noEmit` — zero errors
2. `npm test` — all tests pass
3. `npm run lint` — zero errors
4. `npm run format:check` — clean
5. Manually verify: returning visitor loads prior session; fresh visitor sees init sequence
