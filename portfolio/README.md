This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
$ npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## How the terminal is built

The terminal is a functional core with an imperative shell.
Everything under `terminal/` that is not a `.tsx` file or a hook is plain TypeScript and never imports React.

One idea runs through it: a typed registry of handlers keyed by a discriminant.
Once you have read one registry, you can read the rest.

- Ports and adapters: `createInterpreter(ports)` in `terminal/interpreter.ts` talks to the outside only through `terminal/ports.ts`. The contexts and `useInterpreter` are the adapters.
- Command, with effects as data: commands, questions, and the startup return `Effect[]` instead of doing anything. That makes them easy to test, and lets a pending question store what comes after it and replay it after a reload.
- Chain of responsibility: `ROUTES` in `terminal/routes.ts` tries each way of handling a line in turn. The chat is just the last link.
- Strategy, via exhaustive mapped types: the effect handlers and the history renderers are each keyed by type. A missing handler or renderer fails `tsc`.

To add a command, write one file in `terminal/commands/` and add it to `COMMANDS` in `terminal/registry.ts`.
To add a question, write one file in `terminal/questions/`, add its id to `QUESTION_IDS`, and add it to `QUESTIONS`.
To add an output type, add a schema to `terminal/history/schemas.ts`, a renderer in `terminal/history/renderers/`, and an entry in `terminal/history/registry.ts`.

## Testing

This project follows Next.JS testing suggestions - https://nextjs.org/docs/app/guides/testing/jest

Run tests with

```shell
$ npm run test
```
