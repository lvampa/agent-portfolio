# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

## 5. Workflow Rules

After completing any implementation task:
1. Run `npx tsc --noEmit` to verify the code compiles with no type errors.
2. Run `npm test` to verify all tests pass.

Never ask the user to commit code. Do not suggest git commits unless the user explicitly requests one.

## 6. File Structure Conventions

Each directory should separate concerns across predictably named files:

- `types.ts` — TypeScript interfaces and type aliases only
- `constants.ts` — `const` values and enums only
- `utils.ts` — pure, side-effect-free utility functions
- `index.ts` — re-exports only; no logic

Do not mix types into utils files, or constants into component files. If a file grows to serve two purposes, split it.

## 7. Documentation

Add a JSDoc comment (`/** ... */`) to exported functions and hooks when the signature alone does not communicate the "why" — hidden constraints, non-obvious invariants, or surprising behavior. One line is enough. Skip self-evident wrappers.

Examples that warrant a comment:
- `buildUserInfoForUi` — explain that it returns null on SSR (no parsedUA)
- `createEventBus` — explain the deduplication behavior in `on()`

Examples that don't need a comment:
- `useHistory` — the name and return type are self-documenting
- `append` — obvious from context
