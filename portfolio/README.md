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
npm test             # Jest (app and lib projects)
npx tsc --noEmit     # Type check
```

## Environment variables

Set these in `.env.local`.
Next.js inlines them at build time.

| Variable                       | Meaning                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_CHAT_WEBHOOK_URL` | Base URL of the n8n chat webhook.                                              |
| `NEXT_PUBLIC_INFO_URL`         | URL that returns the visitor's request info, shown in the first history entry. |
| `NEXT_PUBLIC_NO_HISTORY`       | Local development only. Set to `true` to clear history on every page load.     |

## How it talks to n8n

`lib/hooks/useChat.ts` sends `POST <NEXT_PUBLIC_CHAT_WEBHOOK_URL>/webhooks` with `{ "chatInput": "<message>" }`.
The workflow replies with a JSON array of `{ "output": "<text>" }` items.
The response is validated with Zod, and each item is added to the history as a message.
History is kept in `localStorage`, and items that fail validation are dropped on load.
