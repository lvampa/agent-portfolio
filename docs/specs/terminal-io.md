# Terminal input and output

## Problem

Every submitted line goes to the n8n chat.
There is no way to run a local command, ask the visitor a question, or remember who they are.
Output is a flat `{ type, value: string }` item, so anything richer than a line of text has to be packed into a string.
The client info item already does this: it stores JSON in `value` and parses it again when it renders.
A list, a table, or an image would each repeat that.

PR #10 designed and built the input side (`docs/specs/terminal-commands-and-questions.md` on `feature/frontend-improvements`).
This spec carries that design onto the reorganized layout from PR #11 and adds a typed output model.
Port code from PR #10 where it fits, adapted to the paths and item shapes below.

## Goals

- Adding a command is one file plus one registry entry.
- Adding a question is one file, one id in `QUESTION_IDS`, and one registry entry. The id schema is derived from `QUESTION_IDS`.
- Adding an output type is one schema, one renderer, and one registry entry, and TypeScript fails the build if the renderer is missing.
- Commands, questions, the router, and the startup are pure functions that are easy to test without React.
- One place decides whether the prompt accepts input.

## Non-goals

- The list, table, and image output types themselves. The model must make them easy, and `list` is the worked example below.
- Command arguments or flags.
- A state machine library or a plugin system.
- PR #10's `NEXT_PUBLIC_NO_HISTORY` flag and env check. They land with PR #10.

Port these PR #10 changes, because this design depends on them:

- PR #10's `Storage` class as is (`354999e`, `dd9565e`), including legacy keys, the 200-item cap, and the try/catch around writes.
- The chat error item and the 30 s request timeout (`c4b027b`).
- The numeric `asn` fix (`ae773ad`). Without it the client info never loads and the startup cannot be seen.

## Behavior

On a first visit the screen shows, top to bottom:

1. The banner: `Portfolio Agent (Version 2.1.6)`, `(c) 2026 Connor Abdelnoor. All rights reserved.`, `Traditional portfolio @: ` with the static portfolio URL as a link, then a blank line.
2. The client info sequence: `clientinfo` typed after the prompt `C:\Users\unknown>`, then `Loading Client Information....`, then the info rows in two columns.
   Every row is laid out up front and faded out; each row's label, such as `ip:`, appears when its row starts and its value streams, so the columns never slide.
3. A blank line, then the question `User unknown, please identify:`, shown as the input prompt.
   A non-blank answer becomes the name, prints `Confirmed identity: <name>`, and changes the prompt from `C:\Users\unknown>` to `C:\Users\<name>>`.
   A blank answer prints `Unconfirmed identity`.
4. A blank line, the guidance line `Ask about the author, or type help for other commands.`, and another blank line before the input prompt.
5. From then on, a line that is exactly a command name runs that command, and anything else goes to the chat.

The registry ships with three commands:

- `help`, `h` prints a `list` with one row per command, built from `state.commands`: the names, such as `help, h`, then the description.
- `cls`, `clear` clears the screen and the saved history, and starts a new conversation with a new session id.
  A reload right after `cls` finds the history empty, so the startup replays, without the question when a name is saved.
  Anything typed after `cls` is saved, so a later reload restores it instead.
- `whoami` prints a `list`: a `name:` row with the name (or `unknown`), a `session:` row with the session id, so a visitor can quote it, then a row per client info item when it loaded.
  Its terms end in a colon, like `systeminfo`, and so do the startup's info labels, through `infoTerm(label)`.
  The colon is in the term data, so `List` stays generic, and `help`'s terms have none.

A command runs only when nothing follows it, so `help me understand his AWS work` will go to the chat.
A blank line in command mode prints an empty prompt line and does nothing else.
On a reload, stored history renders as before and the startup does not replay.
Restored items render at once, so the prompt shows right away.
New output reveals one item at a time (see Reveal), and any key or click shows the rest at once.
Under `prefers-reduced-motion: reduce`, new output shows at once and nothing waits on it.
Up recalls the last submitted command into the input, like `cmd`.
Down clears it again, but only while the input still holds the recalled command, so a typed draft is never lost.
Esc clears the line.
Only the last command is kept, in memory for the visit, and an answer to a question is never recalled.
The page's `<main>` is the only scroll container, at `100dvh`, and `useStickToBottom` from `use-stick-to-bottom` keeps it at the bottom whenever the content resizes, including while a reply streams.
Any scroll up stops following, and scrolling back to the bottom resumes it; content shrinking, as after `cls` or when the keyboard closes, does not stop it.
The viewport sets `interactive-widget=resizes-content`, so on Android the keyboard shrinks `100dvh` and the prompt stays above it.
While the agent is working, `ReplLoading` shows a `|/-\` spinner, with `Waiting for the agent` for screen readers and under reduced motion.

## Architecture

Functional core, imperative shell, built from four patterns that each solve a problem this app has.
The design is a little more structured than five commands need, on purpose: this is a portfolio, and the structure is part of what it shows.

| Pattern | Where | Problem it solves |
|---|---|---|
| Ports and adapters | `createInterpreter(ports)` | The core is plain TypeScript and never imports React. Contexts are adapters. |
| Command, with effects as data | commands, questions, startup | Behavior is returned as data, so it can be tested, stored in a pending question, and replayed. |
| Chain of responsibility | `ROUTES` | Each way of handling a line is one small link, and the chat is just the last one. |
| Strategy, via exhaustive mapped types | effect handlers, renderers | Each variant has its own handler, and a missing one fails the type check. |

One idea runs through all of them: a typed registry of handlers keyed by a discriminant.
Commands, routes, effect handlers, and renderers are all registries, so a reader who understands one understands the rest.
The README should tell this story in a short section.

Rejected on purpose:

- A state machine or reducer for input gating. Whether input is accepted follows from four values, so a pure selector is correct by construction, and a reducer would add transitions that can drift.
- A dependency injection container or plugin system. The registries are the extension points, and a container would only add indirection.

### Output items

A history item is a discriminated union on `type`, with a typed payload per type:

```ts
type HistoryItem =
  | { type: 'text'; text: string }                  // A plain line. Empty text is a blank line.
  | { type: 'command'; line: string; prompt: string } // The echo of a submitted line.
  | { type: 'message'; text: string }               // A chat reply.
  | { type: 'error'; text: string }                 // A failed chat request.
  | { type: 'link'; text: string; label: string; href: string } // Lead-in text, then `label` as a link. Only https hrefs validate.
  | { type: 'clientInfo'; info: UserInfo; prompt: string } // The typed client info sequence.
  | { type: 'list'; items: { term: string; detail: string }[] }; // Two aligned columns, used by help and whoami.
```

The schema is built from one schema per type with `z.discriminatedUnion('type', [...])`, and the type is inferred from it.
Stored items are validated one by one with `safeParse`, and invalid ones are dropped, as today.
The `thinking` and `help` types are removed, since nothing creates them.

Renderers are registered in a mapped type, so each one receives its own item shape and none can be missing:

```ts
type Renderers = {
  [K in HistoryItemType]: React.FC<{ item: Extract<HistoryItem, { type: K }>; progress: RevealProgress }>;
};

export const renderers: Renderers = {
  text: Text,
  command: Command,
  message: Message,
  error: ErrorLine,
  clientInfo: ClientInfo,
  list: List,
  link: LinkLine,
};
```

Item schemas and types stay free of React, so the pure core can import them without loading components.
Renderers live in `history/renderers/` and are the only files that know how a type looks.

### Effects

```ts
type Effect =
  | { type: 'print'; item: HistoryItem }
  | { type: 'clear' }
  | { type: 'newConversation' } // A new session id, so the agent starts without memory.
  | { type: 'setName'; name: string }
  | { type: 'ask'; questionId: QuestionId; subject?: string } // subject: what the question is about, such as a message to resend.
  | { type: 'chat'; message: string };
```

Small builders keep call sites short: `printText(text)`, `print(item)`, `echo(line, prompt)`, `ask(id, subject?)`, `chat(message)`, `newConversation()`.
A command that needs richer output prints a different item type.
It never formats structure into text.

### Commands

```ts
interface Command {
  names: readonly string[]; // The first name is the one help shows first.
  description: string;
  run(state: TerminalState): Effect[];
}

interface TerminalState {
  name: string | null;
  sessionId: string; // Keys the agent's memory.
  clientInfo: UserInfo | null;
  commands: readonly Command[]; // So help can list the registry without importing it.
}
```

`run` takes no arguments, since a command only runs when nothing follows its name.
Add an `args` parameter when the first command needs one.

`COMMANDS = createRegistry([...])` lowercases every name and throws at module load if a name appears twice.
Matching is case-insensitive.

### Questions

```ts
interface Question {
  id: QuestionId;
  text: string; // Shown as the input prompt while waiting.
  label: string; // The input's accessible name while waiting, since the visible prompt is aria-hidden.
  answerKeys?: readonly string[]; // Keys that answer at once, without Enter.
  onAnswer(answer: string, state: TerminalState, subject?: string): Effect[];
}
```

Questions live in a record keyed by id.
A pending question is state, not a promise:

```ts
type Mode =
  | { type: 'command' }
  | { type: 'awaiting'; questionId: QuestionId; subject?: string; then: Effect[] };
```

`then` holds the effects that came after the `ask`, so the startup continues to the guidance line after the answer, and a reload mid-question asks again and still continues.
The answer is echoed as a `command` item with the question text as its prompt, so the screen reads `User unknown, please identify: connor`.
With `answerKeys`, `InputForm` answers on one keypress with the upper-cased key, other single keys do not type, Enter does nothing, and a held line waits until the question is gone.

### Name and prompt

`sanitizeName` is the only place names are cleaned.
It strips `\` and `>`, trims, caps at 20 code points (not UTF-16 units, so an emoji is never split), and returns `null` when nothing is left.
`promptFor(name)` returns `C:\Users\${name ?? 'unknown'}>`.
The prompt is always derived, never stored on its own.
The visible prompt is `aria-hidden`, so `currentInputLabel(mode)` gives the input its accessible name: the question's `label` while awaiting, such as `User unknown, please identify. Press Enter to skip.`, and `Command or question` otherwise.
A focused field's label change is not announced, so an sr-only `role="status"` in `InputForm` speaks the question's `label` once the input goes live while awaiting.

## Routing

Routing is a chain of responsibility.
Each route either claims the line and returns its effects, or returns `null` to pass it on:

```ts
interface Route {
  name: string;
  handle(line: string, mode: Mode, state: TerminalState): Effect[] | null;
}

const ROUTES: readonly Route[] = [answerPendingQuestion, ignoreBlankLine, runExactCommand, sendToChat];
```

`route(line, mode, state)` prepends the echo, using `currentPrompt(mode, state.name)`, and returns the effects of the first route that claims the line.
Effects that print end with one blank line, unless they end in a chat, an ask, or a blank line already.
`sendToChat` always claims it, so the chain never falls through, and a test asserts that it is last.

1. `answerPendingQuestion`: when awaiting, returns `onAnswer`, then `mode.then`.
2. `ignoreBlankLine`: a blank line returns no effects beyond the echo.
3. `runExactCommand`: when the whole trimmed line is a command name, returns `command.run(state)`.
4. `sendToChat`: returns `chat(line)`.

A new way of handling input, such as a `!` shortcut, is one route and one entry in `ROUTES`.

## Interpreter

The interpreter is pure TypeScript and talks to the outside only through ports:

```ts
interface Ports {
  history: { append(item: HistoryItem): void; clear(): void };
  session: { setName(name: string): void; setMode(mode: Mode): void; newConversation(): void };
  chat: { send(message: string): Promise<ChatResult> };
}

function createInterpreter(ports: Ports): { apply(effects: Effect[]): Promise<void> };
```

`apply` first sets the mode to `command`, then dispatches each effect through a handler registry:

```ts
type EffectHandlers = {
  [K in Effect['type']]: (
    effect: Extract<Effect, { type: K }>,
    context: { ports: Ports; rest: Effect[] },
  ) => 'continue' | 'stop' | Promise<Effect[]>;
};
```

| Effect | Handler |
|---|---|
| `print` | `history.append(item)` |
| `clear` | `history.clear()` |
| `setName` | `session.setName(name)` |
| `ask` | `session.setMode({ type: 'awaiting', questionId, subject, then: rest })`, then `'stop'` |
| `chat` | `await chat.send`, then resolve to `chatResultEffects(result, message)` |

`apply` runs effects as a queue, and an async handler's follow-up effects go to its front, so they run before the rest.
An `ask` among the follow-ups still parks everything after it.
A handler that returns `'continue'` synchronously keeps the walk synchronous.
Effects before the first chat apply in the same tick, which the startup relies on.

`useInterpreter()` is the adapter.
It builds the ports from `HistoryContext`, `SessionContext`, and `useChat`, memoizes the interpreter, and returns `{ apply, busy }`, with `busy` true for the whole apply of any list that contains a chat, so the input returns in the same render as the reply.
`createInterpreter` is tested with fake ports, with no rendering.

`Repl` registers its submit handler once, as a `useEffectEvent`, so it always reads the current mode, state, and input state.
Otherwise an Enter pressed in the frame the input appears can reach a stale handler and be dropped.

## Startup

```ts
function startupEffects(state: TerminalState): Effect[] {
  return [
    newConversation(),
    ...BANNER_LINES.map(printText),
    print(PORTFOLIO_LINK),
    printText(''),
    ...(state.clientInfo
      ? [print({ type: 'clientInfo', info: state.clientInfo, prompt: promptFor(state.name) })]
      : []),
    ...(state.name ? [] : [printText(''), ask(QUESTION_IDS.IDENTIFY)]),
    printText(''),
    printText(GUIDANCE_LINE),
    printText(''),
  ];
}
```

`useStartup` runs it once history, session, and client info have loaded, and only when history is empty.
It starts with `newConversation()`, because empty history means the agent should not remember the last conversation.
`newConversation` is its own effect, not part of `clear`, because the startup needs a new id without clearing anything.
It runs in a `useLayoutEffect` guarded by a ref, so Strict Mode does not run it twice and items append before paint.
The seeding effect in `app/page.tsx` goes away.

## Input gating

```ts
type InputState = 'starting' | 'busy' | 'revealing' | 'awaiting' | 'idle';
```

`getInputState({ hasStarted, busy, isRevealing, mode })` is a pure selector that checks in that order.
It is a selector and not a state machine, because every input to it already has a single owner.
The input accepts lines only for `awaiting` and `idle`, and `ReplLoading` shows for `busy`.
In the other states the input stays mounted and focused, but its row is faded out with opacity, since `display` or `visibility` would drop focus.
Typing buffers, like type-ahead in `cmd`.
Enter in those states keeps the line and submits it once the input accepts lines again.
The input has `aria-disabled` while it does not accept lines, and the drawn caret is not shown while the row is faded.

## Reveal

`HistoryContext` keeps `revealedCount`, the index of the first item not fully shown, next to `items` and a `generation`.
On load it is the stored length, so restored history is instant; `clear` resets it to 0 and bumps the generation.
`useReveal()` moves the cursor past items with no steps and returns `{ revealedCount, isRevealing, revealAll }`, so an append hides the prompt in the same render.
Reduced motion is handled there, once.
`History` renders the items before the cursor in full, the item at the cursor with live progress, and nothing after it.
`markRevealed(generation, count)` only moves the cursor forward within the same generation, so a row finishing late after `cls` cannot move the new cursor.

Pacing is data, in `REVEAL_STEPS` in `history/registry.ts`, a mapped type like the renderers, so a missing entry fails `tsc`:

```ts
type RevealStep = { type: 'hold'; ms: number } | { type: 'stream'; length: number; msPerChar: number };
```

- `text`, `link`, `error`: `hold(60)`. `list`: `hold(60)` per row.
- `command`: `hold(150)` when the line is non-empty; an empty Enter has no steps, so the prompt does not blink.
- `message`: one stream at 4 ms per character over the parsed reply.
- `clientInfo`: `clientinfo` at 15 ms per character, `hold(150)`, the loading line, then each value, at 4 ms per character.

The pure `revealProgressAt(steps, elapsedMs)` returns `{ step, chars, isDone }`.
`useRevealProgress` runs a 16 ms interval for the current row only and reads `Date.now()`, so the rate holds when the browser clamps timers.
Renderers get `progress`, and fully shown items get `REVEALED`; renderers own no timers.
Streamed text renders through `StreamedText`: an sr-only full copy and an aria-hidden slice.
`useSkipReveal` calls `revealAll()` on any key or click while revealing, except modifier shortcuts and clicks on links, and never prevents the default.

## Structured replies

History keeps the raw reply text; it is parsed when it renders.
The pure `parseReply(text)` returns paragraphs and lists, checked line by line so a list can follow its lead-in line.
List lines start with `- ` or `* `.
Spans are text, bold (`**x**`), and links: `[label](https://...)`, bare `https://` URLs with trailing punctuation left outside, and emails as `mailto:`.
Only https links are made, and any other scheme stays literal text.
Each span carries its offset in the stream.
`Message` builds the whole structure up front, so links and bold never reflow, and keeps unreached blocks sr-only.

## Chat failures and retry

`useChat` never rejects and resolves to a `ChatResult`: `{ ok: true; replies }` or `{ ok: false; failure }`.
`toChatFailure` maps a `TimeoutError` to `timeout`, a `TypeError` (network or CORS) to `network`, an `HttpError` with status 429 to `quota`, and anything else, including an invalid reply, to `server`.
`chatResultEffects` prints each reply as a `message`, then a blank line.
A failure prints its lines from `CHAT_FAILURES`, then asks `RETRY_CHAT` with the message as its subject:

| Failure | Lines |
|---|---|
| `timeout` | `The agent did not respond in 30 seconds.` |
| `network` | `Could not reach the agent. It may be offline. Try again in a moment.` |
| `quota` | `Connor's free tier agent is refusing to work any more for the moment.`, then a link to LinkedIn |
| `server` | `CHAT_ERROR_MESSAGE` |

A 429 can be the per-minute limit, so `quota` offers a retry too.
For it to reach the browser, n8n must answer 429 with the same CORS headers as a success.
The retry question shows `Retry? (Y/N)` and answers on one key: Y echoes `Retry? (Y/N) Y` and resends the subject, N returns to the prompt.
N prints a blank line first, like the end of a reply.
A reload mid-question asks again, since the subject is stored in the mode.

## Persistence

| Key | Holds | Schema |
|---|---|---|
| `history.v2` | Array of history items | `HistoryItemSchema` |
| `session.v1` | `{ name, mode, sessionId }` | `SessionSchema` |

The item shape changes, so the version moves to `history.v2`, and the legacy `history` key is removed on load without being parsed.
`Storage` gains `loadValue(schema)` and `save(value)` for the session object.
Name the instance `sessionStore`, not `sessionStorage`, which would shadow `window.sessionStorage`.
A session that fails validation loads as `{ name: null, mode: { type: 'command' } }` with a new `sessionId`, and a loaded name goes through `sanitizeName` again.
`sessionId` comes from `randomUuid()` in `lib/utils/uuid.ts`, which uses `crypto.randomUUID` and falls back to `getRandomValues`, because `randomUUID` only exists in secure contexts and `npm run dev` may be opened over plain http on the LAN.
A stored session without one, from before ids existed, gets one on load through `.catch` in `SessionSchema`, so the key stays `session.v1`.

### Chat request

`POST <NEXT_PUBLIC_CHAT_WEBHOOK_URL>/webhooks` with:

```json
{
  "chatInput": "<message>",
  "sessionId": "<uuid>",
  "name": "<name or null>",
  "client": {
    "city": "<or null>",
    "country": "<or null>",
    "organization": "<or null>",
    "browser": "<or null>",
    "os": "<or null>",
    "device": "<or null>",
    "referer": "<or null>",
    "botRisk": "<low, high, or null>"
  }
}
```

`sessionId` keys the agent's memory.
`buildChatVisitor` in `lib/utils/clientInfo.ts` builds `client` from the client info request and the UA parse the UI already uses.
Each field is null when its source did not load.
`referer` is the page's `document.referrer`, or `Direct` when it is empty, because the Worker's `referer` header is the page itself, which fetches `/info`.
The whoami and startup `referer` row uses the same value.
It lists the fields one by one, so the IP, latitude, and longitude are never sent.
`useInterpreter` builds the body, because the session and the visitor belong to the adapters, not the pure core.

The body is client-controlled, so anyone can send any `sessionId`, `name`, or `client` values.
Before the memory node and the log write, the n8n workflow must check that `sessionId` is a UUID, cap the length of every field, and sanitize `name` again.
`whoami` prints the session id, so it may show up in screenshots; it keys memory, not access, so a leaked id exposes at most that conversation's context to whoever reuses it.
The storage instances are created in the terminal, not in `lib/storage`, since the keys belong to the terminal.

## File layout

```
terminal/
  types.ts constants.ts schemas.ts utils.ts
  registry.ts      createRegistry, findCommand, COMMANDS
  routes.ts        the Route links and ROUTES
  router.ts        route, currentPrompt
  ports.ts         the Ports interface
  interpreter.ts   createInterpreter and the effect handlers
  startup.ts       startupEffects
  index.ts         re-exports, pure modules only
  SessionContext.tsx
  commands/        help.ts cls.ts whoami.ts index.ts, one file per command
  questions/       identify.ts retryChat.ts registry.ts index.ts
  history/
    schemas.ts     one schema per item type, and the union
    types.ts constants.ts utils.ts  utils holds revealProgressAt and parseReply
    registry.ts    the renderers map and REVEAL_STEPS
    renderers/     Text Command Message ErrorLine LinkLine ClientInfo List, plus Columns and StreamedText
    History.tsx HistoryContext.tsx useReveal.ts
  repl/
    Repl.tsx InputForm.tsx ReplLoading.tsx
    useInterpreter.ts useStartup.ts useSkipReveal.ts
    EventBusContext.tsx constants.ts types.ts
```

The event bus is unchanged and still carries only `SUBMIT`.
The event payload becomes the submitted line, not a history item.

## Worked example: adding a list output

A new output type takes three files, and `list` was added this way.
`printList`, the `ListRow` type, and the shared `Columns` came on top, for the call sites and the startup.

1. `history/schemas.ts`: `ListItemSchema = z.object({ type: z.literal('list'), items: z.array(ListRowSchema) })`, with `ListRowSchema = z.object({ term: z.string(), detail: z.string() })`, added to the union.
2. `history/renderers/List.tsx`: the component.
   It renders `Columns`, a `<dl>` grid with `grid-cols-[max-content_minmax(0,1fr)]` and a two-character column gap, so terms take the widest term's width and the details line up after it, as in DOS.
   It lays out every row up front and fades each in at its reveal step.
3. `history/registry.ts`: `list: List`, and its pacing in `REVEAL_STEPS`. Until both exist, `tsc` fails.

`printList(items)` in `utils.ts` builds the effect, so `help.run` returns `[printList(commands.map(...))]`.
The startup client info uses the same `Columns`, with streamed values, so it looks the same as `whoami`.
A table or an image is the same three steps.

## Testing

A few tests for the real risks:

- `router.test.ts`: one table through `route`. Awaiting sends the line to the question and appends `then`. A test-only command matches case-insensitively. A command word followed by more text goes to the chat. A blank line is only echoed.
- `identify.test.ts`: a name sets it, a blank or all-stripped answer stays unknown, and the cap never splits an emoji.
- `registry.test.ts`: a duplicate name throws.
- `interpreter.test.ts`, with fake ports: effects apply in order, an `ask` parks the rest in `then` and stops, a timeout prints its line and parks `RETRY_CHAT` with the message, and a quota failure prints its two items and asks too.
- `history/__tests__/utils.test.ts`: one `parseReply` case and one `revealProgressAt` case.
- `lib/hooks/__tests__/utils.test.ts`: `toChatFailure` for a timeout, a network error, a 429, and a 500.
- `routes.test.ts`: `sendToChat` is the last route.
- `startup.test.ts`: no name includes the ask, a saved name leaves it out, and missing client info skips that step.
- `history/__tests__/schemas.test.ts`: an invalid stored item is dropped and valid ones survive.
- One Repl integration test file: a first visit asks and then prints the guidance, restored history skips the startup, a reload mid-question asks again, the input is named by the question while awaiting and `Command or question` after, typing during a chat keeps focus and the buffered text, Enter during a chat submits the buffered line once the reply lands, and restored client info shows in full without holding back the prompt.
- `ReplInput.test.tsx`: Up recalls the last command and Down clears it, Down keeps a typed draft and Esc clears it, an answer is not recalled, and an inactive input is hidden but keeps focus and buffered text.

Update the existing tests the change touches, and delete ones that only test the old string items.
Reveal timing, skipping, and renderers have no tests; they are checked by hand.

## Builder's calls

- Help line format, as long as it is one text line per command for now.

## Decided while reviewing the spec

- No commands ship in this PR. The router and registry are tested with a command that exists only in the test.
- The exact `Command` renderer markup, as long as it shows the stored prompt.
