# Terminal commands and questions

## Problem

Every submitted line goes to the n8n chat.
There is no way to run a local command, ask the visitor a question, or remember who they are.
Input gating is spread across `isReady` in `page.tsx`, `isLoading` from `useChat`, and `isAnimating` from `AnimationContext`.
The startup is a one-off `useLayoutEffect` in `page.tsx` that seeds the client info item.

## Goals

- The site reads like an old Windows command prompt, with a banner, a sign-in question, and local commands.
- Adding a command is one file plus one registry entry.
- Adding a question is one file plus one registry entry.
- Commands and questions are pure functions that are easy to test without React.
- One place decides whether the prompt accepts input.

## Non-goals

- Command arguments, flags, or an argument parser library.
- XState or any state machine library.
- A plugin system.
- The `identify` command itself. The design must make it trivial, and it is the worked example below.
- Sending the visitor's name to the chat.

## Behavior

On a first visit the screen shows, top to bottom:

1. A fixed banner, for example `Connor Abdelnoor Portfolio [Version 1.0]` and `(c) 2026 Connor Abdelnoor. All rights reserved.` Builder's call on exact wording.
2. The client info sequence (`Loading Client Information . . . .` then the info lines), unchanged.
3. The question `Please Identify`.
   A non-blank answer becomes the name, and the prompt changes from `C:\Users\unknown >` to `C:\Users\<name> >`.
   A blank answer prints a line saying they are staying as unknown.
4. The guidance line: `Ask about the author, or type help for other commands.`
5. From then on, known commands run locally and anything else goes to the chat.

Launch commands:

| Names | Does |
|---|---|
| `help`, `h` | Lists every command and its description, generated from the registry. |
| `cls`, `clear` | Clears the screen and the stored history. |
| `whoami` | Prints the name and the loaded client info lines. |

On a reload, the stored history renders as before and the startup does not replay.

Spec writer's call: a blank line in command mode prints an empty prompt line and does nothing else, like `cmd.exe`.
Today a blank line goes to the chat, so this is a behavior change.

## Architecture

Functional core, imperative shell.
Commands, questions, the router, and the startup sequence are pure functions with no React.
They return a list of effects.
One interpreter hook in the React layer applies the effects, in order.

### Effects

```ts
type Effect =
  | { type: 'print'; item: HistoryItem }
  | { type: 'clear' }
  | { type: 'setName'; name: string }
  | { type: 'ask'; questionId: QuestionId }
  | { type: 'chat'; message: string };
```

Effects are plain data, so they can be compared in tests and persisted.
Small builders in `utils.ts` keep call sites short: `printLine(text)`, `ask(id)`, `chat(message)`.

### Commands

```ts
interface Command {
  names: readonly string[]; // The first name is the one help shows first.
  description: string;
  run(args: string, state: TerminalState): Effect[];
}

interface TerminalState {
  name: string | null;
  clientInfo: UserInfo | null; // From buildUserInfoForUi.
  commands: readonly Command[];
}
```

`args` is the rest of the line after the first word.
No launch command uses it, and nothing parses it until a command needs to.
`commands` is in the state so `help` can list the registry without importing it, which would be a cycle.

The registry is an array, validated once at module load:

```ts
export const COMMANDS = createRegistry([help, cls, whoami]);
```

`createRegistry` lowercases every name and throws if a name or alias appears twice.
Throwing at import means a duplicate breaks `npm test` and `next dev` right away.
Matching is case-insensitive on the first word, so `HELP` and `Help` both run `help`.

### Questions

```ts
interface Question {
  id: QuestionId;
  text: string; // Shown as the input prompt while waiting, e.g. "Please Identify:".
  onAnswer(answer: string, state: TerminalState): Effect[];
}
```

Questions live in a record keyed by id, so `ask('identify')` can be persisted and looked up later.

A pending question is state, not a promise:

```ts
type Mode =
  | { type: 'command' }
  | { type: 'awaiting'; questionId: QuestionId; then: Effect[] };
```

We do not use `const answer = await ctx.ask(...)`.
A pending promise does not survive a reload.
React Strict Mode runs effects twice in dev, so the question would be asked twice.
`cls` or an unmount would leave the promise hanging with nothing to resolve it.
A mode value has none of these problems: it is persisted, rendered, and replaced.

`then` holds the effects that came after the `ask` in the same list.
That is how the startup continues to the guidance line after the visitor answers.
It also means a reload mid-question re-asks it and still prints the guidance afterwards.
Spec writer's call: the brief had no field for this, and without it the guidance line is lost on a mid-question reload.

### The question line on screen

While awaiting, the input's prompt label is the question text instead of `C:\Users\<name> >`.
The answer is stored as a normal `command` item with that text as its prompt snapshot.
So the screen reads `Please Identify: connor`, and no new item type is needed for questions.
Showing the question as the prompt, not as a printed line, also keeps it hidden until the client info animation finishes.

### Name and prompt

`sanitizeName(raw: string): string | null` is the only place names are cleaned.
It trims, strips `\` and `>`, caps at 20 characters, and returns `null` when nothing is left.
So an answer of `>>>` counts as blank.
`promptFor(name)` returns `C:\Users\${name ?? 'unknown'} >`.
The prompt is always derived, never stored on its own.

## File layout

The core sits under `app/` because it uses `HistoryItem`, and nothing in `lib/` imports from `app/` today.

```
app/terminal/
  types.ts         Effect, Command, Question, QuestionId, Mode, TerminalState, InputState
  schemas.ts       EffectSchema, ModeSchema, SessionSchema
  constants.ts     BANNER_LINES, GUIDANCE_LINE, UNKNOWN_NAME, MAX_NAME_LENGTH, QUESTION_IDS
  utils.ts         sanitizeName, promptFor, splitLine, getInputState, effect builders
  registry.ts      createRegistry, findCommand, COMMANDS
  router.ts        route(line, mode, state): Effect[]
  startup.ts       startupEffects(state): Effect[]
  commands/
    help.ts  cls.ts  whoami.ts
    index.ts       re-exports
  questions/
    identify.ts
    registry.ts    the QUESTIONS record
    index.ts       re-exports
  index.ts         re-exports
  __tests__/
app/contexts/SessionContext.tsx       name, mode, hasLoaded, setName, setMode
app/components/Repl/useInterpreter.ts applies effects
```

Changes to existing files:

- `History/constants.ts` and `schemas.ts`: add an `output` type and an optional `prompt` on items.
- `History/renderers/Output.tsx`: new, a plain line. Registered in `History/registry.ts`.
- `History/renderers/Command.tsx`: passes `item.prompt` to `CommandPrompt`, falling back to its default.
- `HistoryContext`: adds `clear()`.
- `InputForm`: takes a `prompt` prop.
- `Repl`: the submit handler calls `route` and passes the result to the interpreter.
- `page.tsx`: the seeding `useLayoutEffect` moves into the startup runner.
- `layout.tsx`: wraps children in `SessionProvider`.
- `lib/storage`: versioned keys and a single-value read and write (see Persistence).

The event bus is unchanged.
It still carries only `SUBMIT` from `InputForm` to `Repl`.

## Routing

`route(line, mode, state)` is pure and returns the full effect list, including the echo of the typed line.

1. If `mode` is awaiting, the line is the answer.
   Return `print(echo with question.text as prompt)`, then `question.onAnswer(line, state)`, then `mode.then`.
2. Otherwise split off the first word and look it up in the registry, case-insensitive.
   A command runs only when nothing follows it, so "help me with..." goes to the chat.
   If found, return `print(echo with promptFor(state.name))`, then `command.run(args, state)`.
3. Otherwise return the echo, then `chat(line)`.

Chat is the default handler, not a special case in the interpreter.
`cls` clears its own echo too, which matches Windows.

## Interpreter

`useInterpreter()` returns `apply(effects: Effect[]): Promise<void>`.
It walks the list in order:

| Effect | Applied as |
|---|---|
| `print` | `history.append(item)` |
| `clear` | `history.clear()` |
| `setName` | `session.setName(name)` |
| `ask` | `session.setMode({ type: 'awaiting', questionId, then: rest })`, then stop |
| `chat` | `await sendMessage`, then append `message` items or the existing error line |

Every submitted line first sets the mode back to `command`.
An `ask` in the list is the only thing that puts it back into awaiting.
`busy` is true while a `chat` effect is in flight.
Builder's call: whether `busy` comes from `useChat().isLoading` or a flag in the interpreter.

## Startup

The startup is data:

```ts
function startupEffects(state: TerminalState): Effect[] {
  return [
    ...BANNER_LINES.map(printLine),
    ...(state.clientInfo ? [print(userInfoItem(state.clientInfo))] : []),
    ...(state.name ? [] : [ask(QUESTION_IDS.IDENTIFY)]),
    printLine(GUIDANCE_LINE),
  ];
}
```

It runs through the same interpreter as a submitted line.
The client info step prints today's `user` item, so `User.tsx` and its animation are unchanged.
If client info failed to load, the step is skipped, as today.

When it runs is a check on state, made once history, session and client info have loaded:

- History is not empty: skip. The stored screen is restored, and a stored awaiting mode re-asks its question.
- History is empty: run `startupEffects`.

Spec writer's call: the brief said "skip when a name is saved and history exists".
That rule replays the whole startup on top of existing history for a visitor who answered blank, because no name is saved.
Skipping on "history exists" alone, and leaving out the identify step when a name is saved, covers both cases.
After `cls` and a reload, a named visitor sees the banner and guidance again without being asked, and an unknown visitor is asked again.

The runner keeps today's guard: a ref so Strict Mode does not run it twice, and `useLayoutEffect` so items are appended before paint.

## Input gating

One pure function decides what the prompt shows:

```ts
type InputState = 'starting' | 'busy' | 'animating' | 'awaiting' | 'idle';

function getInputState(input: {
  hasStarted: boolean; // Everything loaded and the startup ran or was skipped.
  busy: boolean;
  isAnimating: boolean;
  mode: Mode;
}): InputState;
```

Checks run in the order of the union.
The input renders only for `awaiting` (question text as prompt) and `idle` (`promptFor(name)`).
`ReplLoading` shows for `busy`.
This replaces `isReady`, `isLoading` and `isAnimating` in `Repl` and `page.tsx`.

The prompt must not flash.
`hasStarted` turns true in the same layout effect that appends the startup items.
Those items mount their `TypingAnimation`, which reports animating from mount in `useLayoutEffect`.
So no frame paints with the prompt between "loaded" and "animating".
Any new animated line must pass `onStart` and `onComplete` from `useAnimation` in the same way.

Spec writer's call: a line submitted while not `idle` or `awaiting` is dropped.
The input is hidden in those states, so this is a guard, not a feature, and no queue is needed.

## Persistence and migration

Two stores, each validated with Zod on load:

| Key | Holds | Schema |
|---|---|---|
| `history.v2` | Array of history items | `HistoryItemSchema` |
| `session.v1` | `{ name, mode }` | `SessionSchema` |

`Storage` gains `loadValue<T>(schema): T | null` and `save(value)` for the session object, with the same try/catch as the array methods.
Name the instance `sessionStore`, not `sessionStorage`, which would shadow `window.sessionStorage`.

The version lives in the key.
On load, the history store removes the legacy `history` key and never parses it.
Old visitors start fresh and see the new startup, which is the point: their history has no banner and no identify step.
Inside a version, the existing per-item `safeParse` still drops anything invalid.
A session that fails validation loads as `{ name: null, mode: { type: 'command' } }`.
A loaded name goes through `sanitizeName` again, so an edited value cannot break the prompt.
A loaded awaiting mode with an unknown `questionId` falls back to command mode.

`NEXT_PUBLIC_NO_HISTORY=true` clears both stores, so the whole sequence, including identify, replays on every refresh.
Read the flag at call time in one shared function, not in a module constant, because the existing `HistoryContext` test sets it per test.

## Worked example: adding `identify`

The question already exists for the startup.
The command is one file:

```ts
// app/terminal/commands/identify.ts
export const identify: Command = {
  names: ['identify'],
  description: 'Change the name you go by.',
  run: () => [ask(QUESTION_IDS.IDENTIFY)],
};
```

And one registry entry:

```ts
export const COMMANDS = createRegistry([help, cls, whoami, identify]);
```

`help` lists it with no other change.
The prompt label, persistence across a reload, and the prompt update after answering all come from the existing question and mode.
The one thing to decide then is what a blank answer means for someone who already has a name.
`onAnswer` already gets `state.name`, so keeping the name and printing `Keeping the name <name>.` is a two-line change in `identify.ts`.

## Testing

A few tests for the real risks, in `app/terminal/__tests__/`:

- `router.test.ts`: one table test.
  An awaiting mode sends the line to the question and appends `then`.
  `HELP` runs `help`.
  An unknown line ends in `chat`.
  A blank line in command mode returns only the echo.
- `identify.test.ts`: a name sets it; a blank or all-stripped answer prints the unknown line and does not set a name; a long name is capped.
- `registry.test.ts`: a duplicate alias throws.
- `startup.test.ts`: no name includes the ask; a saved name leaves it out; missing client info skips that step.

Update the existing tests that the change touches: `ReplErrors`, `ReplInput` (new `prompt` prop), `HistoryContext` (reset clears both stores), and `storage` (legacy key is ignored).
Commands like `whoami` and `cls` are a line or two each and do not need their own tests.

## Open items for the builder

- Exact banner, guidance, unknown-name and help wording.
- Whether the banner and guidance lines type out or appear at once.
- Help line format and whether aliases are shown.
- Whether `busy` comes from `useChat` or the interpreter.
