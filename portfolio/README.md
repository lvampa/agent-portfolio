# Portfolio

A terminal-style portfolio built with Next.js.
Visitors type into a REPL, and an n8n workflow answers through a webhook.
The app is a static export (`output: 'export'`), so there is no server at runtime.

## Scripts

```bash
npm run dev          # Start the dev server on http://localhost:3000
npm run build        # Build the static export into out/
npm run lint         # ESLint
npm run format       # Prettier, write
npm run format:check # Prettier, check only
npm test             # Jest (terminal and lib projects)
npx tsc --noEmit     # Type check
```

## Environment variables

Set these in `.env.local`.
Next.js inlines the `NEXT_PUBLIC_*` ones at build time.
`lib/env.ts` validates the chat URL, so the build fails if it is missing.

| Variable                       | Meaning                                                                                                                             |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_CHAT_WEBHOOK_URL` | Base URL of the n8n chat webhook.                                                                                                   |
| `NEXT_PUBLIC_NO_HISTORY`       | Only applies under `npm run dev`. Set to `true` to clear the stored history and session on every page load, so the startup replays. |
| `DEV_INFO_URL`                 | Only applies under `npm run dev`. The client-info Worker's `workers.dev` URL, which the dev server proxies `/info` to.              |

Client info comes from `/info` on the site's own domain, served by the client-info Worker in `infra/workers/info/`.
`npm run dev` proxies `/info` to `DEV_INFO_URL`, a rewrite in `next.config.ts` that the build leaves out.
Without `DEV_INFO_URL`, dev runs without client info.

## How it talks to n8n

`lib/hooks/useChat.ts` sends `POST <NEXT_PUBLIC_CHAT_WEBHOOK_URL>/webhooks` with:

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
It is a new UUID on `cls` and whenever the startup replays, and `whoami` shows it.
`client` comes from the client info and the UA parse, with nulls when they did not load.
`referer` is `document.referrer` (`Direct` when empty), not the Worker's header, which only sees the page itself.
The IP, latitude, and longitude are never sent.
The workflow replies with a JSON array of `{ "output": "<text>" }` items.
The response is validated with Zod, and each item is added to the history as a message.
History and the session are kept in `localStorage`, and items that fail validation are dropped on load.

## How the terminal is built

The terminal is a functional core with an imperative shell.
Everything under `terminal/` that is not a `.tsx` file or a hook is plain TypeScript and never imports React.

One idea runs through it: a typed registry of handlers keyed by a discriminant.
Once you have read one registry, you can read the rest.

- Ports and adapters: `createInterpreter(ports)` in `terminal/interpreter.ts` talks to the outside only through `terminal/ports.ts`. The contexts and `useInterpreter` are the adapters.
- Command, with effects as data: commands, questions, and the startup return `Effect[]` instead of doing anything. That makes them easy to test, and lets a pending question store what comes after it and replay it after a reload.
- Chain of responsibility: `ROUTES` in `terminal/routes.ts` tries each way of handling a line in turn. The chat is just the last link.
- Strategy, via exhaustive mapped types: the effect handlers and the history renderers are each keyed by type. A missing handler or renderer fails `tsc`.

To add a command, write one file in `terminal/commands/`, re-export it from `terminal/commands/index.ts`, and add it to `COMMANDS` in `terminal/registry.ts`.
To add a question, write one file in `terminal/questions/`, add its id to `QUESTION_IDS`, and add it to `QUESTIONS`.
To add an output type, add a schema to `terminal/history/schemas.ts`, a renderer in `terminal/history/renderers/`, and an entry in `terminal/history/registry.ts`.
