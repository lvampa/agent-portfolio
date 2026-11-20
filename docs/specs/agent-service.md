# Agent service

## Why

The chat agent runs as an n8n AI Agent node, with retrieval spread across six workflow nodes.
We're moving the agent into code: a Python FastAPI service running a LangGraph graph, traced in LangSmith.
n8n stays the front door.
The goals are an agent that lives in the repo, a retrieval path that reads as one graph, a hard cap on model calls per turn, memory that survives restarts, and a trace of every turn.

## Goals

- Replace the middle of the n8n "Portfolio Agent" workflow (Get Previous Turns through the AI Agent) with one HTTP call to `agent-service`.
- Keep answer behavior the same: same model, settings, index, retrieval query, topK, and system prompt.
- Cap each turn at one tool search, so a turn costs at most 2 chat calls and 2 embedding calls, and always ends in a reply.
- Keep chat memory per `sessionId` across restarts.
- Trace every turn in LangSmith (free Developer plan).

## Non-goals

- Ingestion stays in n8n (form, splitter, Pinecone insert).
  Resetting and re-indexing is a separate task.
- No change to the frontend, its payload, or the webhook URL.
- No streaming.
  n8n returns the whole reply, as today.
- No fallback model, retrieval tuning, guardrails pass, or eval set.
  Those stay deferred.
- No pruning of old checkpoint threads.
  Traffic is low.

## Anti-goals

- The service must not be reachable from the internet.
  It has no Caddy route, no published host port, and no tunnel ingress.
- The system prompt must not land in git or in the public image.
- No new ECS service, task, or load balancer.

## Approaches considered

1. **Hand-written `StateGraph` using prebuilt `ToolNode` and `tools_condition` (chosen).**
   `retrieve` → `agent` ⇄ `tools`.
   Each step is its own node and its own LangSmith span, and it matches the hybrid retrieval design.
2. **Prebuilt `create_react_agent` with a pre-model hook for retrieval.**
   Least code, but the fixed search hides inside a hook, and the iteration cap is harder to control.
3. **Plain retrieve-then-generate chain with no tool.**
   Cheapest, but drops the agent's ability to search again, which was decided on 2026-11-09.

Where to cut was also decided: the service owns previous turns, the fixed search, the agent, the tool, and memory.
A literal swap of only the agent node was rejected, because it would leave retrieval split between n8n and the service.

## Request flow

```
Browser → Cloudflare → Tunnel → cloudflared → Caddy → n8n webhook → Validate Request
  → HTTP Request POST http://agent-service:8000/chat
  → Respond to Webhook + Insert row (conversations table)
```

Removed from the workflow: Get Previous Turns, Build Search Query, Search Knowledge and its embeddings, Build Context, the AI Agent with its Gemini model, Window Buffer memory, and the `search_connor_knowledge` tool.

## API

`POST /chat`

```json
{ "chatInput": "string", "sessionId": "string", "name": "string | null" }
```

- `200 { "reply": "string" }`.
- `422` when the body is invalid (FastAPI default).
- `429` when Gemini answers 429, so n8n can pass it through to the frontend's "free tier agent" message.
- `502` for any other upstream failure (Gemini, Pinecone).

`GET /health` returns `200` for the ECS container health check.

There is no auth.
Only containers on the same bridge network or compose network can reach it.

## Graph

State:

```python
class ChatState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]  # checkpointed
    name: str | None
    context: str       # this turn's retrieved chunks
    tool_rounds: int   # reset to 0 at the start of each turn
```

The thread id is `sessionId`.
Each request invokes the graph with the new `HumanMessage`, `name`, and `tool_rounds = 0`.

Nodes:

- **`retrieve`**: builds the search query from the previous `HumanMessage` in the thread plus the new message, joined by a newline, or the new message alone on the first turn.
  This matches today's Build Search Query, but reads the checkpoint instead of the `conversations` Data Table.
  It searches Pinecone `portfolio-rag`, namespace `portfolio`, with `gemini-embedding-2` and topK 4.
  It writes the chunk texts to `context`, joined by `\n\n---\n\n`, as Build Context does today.
- **`agent`**: fills the system prompt with `context`, trims the history to the last 5 turns, and calls `gemini-3.5-flash-lite` at temperature 0.6 with 1024 max output tokens.
  It binds `search_connor_knowledge` only while `tool_rounds == 0`.
  The second call has no tools, so it can only answer.
- **`tools`**: prebuilt `ToolNode` with `search_connor_knowledge`, same description as today, topK 4.
  It increments `tool_rounds`, then returns to `agent`.

Edges: `START → retrieve → agent`, then `tools_condition` sends tool calls to `tools` and everything else to `END`.
`recursion_limit` stays as a backstop.
The reply is the text of the last `AIMessage`.

The 5-turn trim matches the n8n Window Buffer default.
Like the Window Buffer, earlier turns are sent as user messages and final replies only, without their tool calls and results.
Only the model call is trimmed; the checkpoint keeps the full thread.
If Gemini returns more than one tool call at once, only the first runs, to hold the cap of 2 embedding calls.
`name` is not in today's prompt and stays out of it; it goes to LangSmith as metadata.

## Memory

A LangGraph SQLite checkpointer stores threads in `checkpoints.sqlite`.

- Prod: `/opt/n8n-data/agent/` on the encrypted EBS data volume, so it survives instance replacement and is in the daily snapshot.
- Local: a new `agent_data` compose volume.

Threads held in n8n's RAM today are lost at cutover.
That's acceptable.

## Model and errors

The chat model gets at most 1 retry, so a 429 reaches the frontend well inside its 30 s timeout instead of burning it on backoff.
n8n's HTTP Request node uses a 25 s timeout.

## System prompt

The prompt has personal details and is gitignored today, inside the workflow JSON.
The service reads it from the `SYSTEM_PROMPT` environment variable.
In prod that comes from a new SSM SecureString (about 3 KB, fits a standard parameter).
Locally it comes from a gitignored file.
The one n8n expression in it, `{{ $json.context }}`, becomes the graph's `context` field.

## LangSmith

Tracing is on through `LANGSMITH_TRACING` and `LANGSMITH_API_KEY`, with `LANGSMITH_PROJECT` set per environment (`portfolio-agent-local`, `portfolio-agent-prod`).
Each turn is one trace: `retrieve` with its query and chunks, `agent`, an optional `tools` call, and the final `agent` call.
Metadata: `sessionId` and `name`.

Visitor names and messages are sent to LangSmith unmasked.
Logs already keep names on purpose, and this is a private debugging account.

The free Developer plan includes 5,000 base traces a month, kept for 14 days.
Real traffic is far below that.
If a month goes over, traces past the limit are the cost, not chat.

## Containers

### Local

A third service in `n8n-local/docker-compose.yml`:

- Builds from `../agent-service`.
- Bind-mounts the source and runs `uvicorn --reload`.
- Reads `GOOGLE_API_KEY`, `PINECONE_API_KEY`, and `LANGSMITH_API_KEY` from the existing gitignored `n8n-local/.env`.
- n8n calls `http://agent-service:8000/chat`.
- No published port, unless publishing 8000 helps when curling from the host.

### Prod

A fourth container in the existing `n8n` ECS task in `infra/modules/ecs`:

- The task uses `network_mode = "bridge"`, so containers don't share localhost.
  n8n gets `links = ["agent-service:agent-service"]`, the same pattern Caddy and cloudflared use.
- No port mappings.
- `essential = false` with an ECS container restart policy, so a crash or OOM kill restarts only this container.
  The rest of the task, including the n8n editor, stays up.
  Chat answers 502 while it restarts.
  n8n does not `dependsOn` it, so a bad image or missing secret never blocks n8n from starting.
- Mounts only `/opt/n8n-data/agent`, as its own host-path volume, not the whole data volume, which also holds n8n's database.
  The directory must be writable by uid 1000, which `user_data.sh` uses for the volume root.
- Secrets from new SSM parameters: Gemini key, Pinecone key, LangSmith key, and system prompt.
  These are write-only values like the existing ones, and the execution role's read-secrets policy covers them.
- Its own CloudWatch log group with 7-day retention.
- A hard memory limit of 384 MiB inside the task's 1536 MiB.
  Before the first apply, measure n8n's real usage on the instance (`docker stats`).
  If 1536 is too tight, raise the task limit as far as the 2 GiB instance allows after the OS and the ECS agent.
- A container health check against `/health`.
- The image is pinned by tag in the `agent_service_image` variable, which has no default and is set in the gitignored tfvars.
  The tag is the git SHA that CI publishes, so there is no value to commit before the first publish.
  A validation rejects anything outside `ghcr.io` and any `:latest` tag.
- The system prompt reaches its write-only SSM value through the gitignored tfvars, like the other secrets.

## Image

- The image is built on merge to `main` when `agent-service/**` changes.
- A new workflow builds arm64 and pushes `ghcr.io/<owner>/agent-service:<git sha>` with `GITHUB_TOKEN`.
- The package is public, so ECS pulls it without credentials.
  The repo is already public, so this exposes nothing new.
  The system prompt is not in the image.
- Deploying means bumping the tag variable and applying, which Connor runs.
- `ci.yml` gets a job that lints and tests `agent-service`, so the `main` ruleset's `ci` check covers it.

## Code layout

A new top-level `agent-service/` managed with `uv`, with `pytest` for tests.
It follows the repo's file-structure conventions where they fit Python.

Tests cover the real risks, not every function:

- The step cap: with a fake model that always asks for a tool, a turn makes exactly 2 model calls and returns a reply.
- The retrieval query: the first turn uses the message alone, and a later turn prepends the previous user message.
- A Gemini 429 becomes HTTP 429.

## n8n workflow changes

Made by hand in the editor, locally and then in prod.
Download the current workflow first, as a rollback copy.

- Delete the nodes listed under Request flow.
- Add an HTTP Request node after Validate Request: POST to `http://agent-service:8000/chat` with `{ chatInput, sessionId, name }` and a 25 s timeout.
- Its error output leads to a Respond to Webhook node that sends 429 with CORS headers when the service answered 429, and 502 otherwise.
- Respond and Insert row read the reply from the HTTP response.
  Respond must keep today's body shape, `[{ "output": reply }]`, because the frontend parses that.

## Rollout

1. Build and test locally against the local n8n.
   Check a few turns in LangSmith.
2. Merge, so CI publishes the image.
   Make the GHCR package public once.
3. Connor does these before the first apply:
   - SSH in and run `sudo install -d -o 1000 -g 1000 /opt/n8n-data/agent`, because `user_data.sh` is not changed.
   - Make the GHCR package public after the first publish.
   - Set `agent_service_image` to the published tag, and the four secrets (`gemini_api_key`, `pinecone_api_key`, `langsmith_api_key`, `agent_system_prompt`) in the gitignored tfvars.
   - Run `docker stats --no-stream` on the instance to confirm 384 MiB fits next to n8n.
   Then he applies.
4. Edit the prod workflow.
   Confirm a chat works end to end and shows up in LangSmith.

Rollback: re-import the saved workflow.
The container can stay running unused.

## Decided while building

- Python 3.14, with library versions pinned in `uv.lock`.
- Local compose mounts the gitignored prompt file and sets `SYSTEM_PROMPT_FILE`, the fallback used when `SYSTEM_PROMPT` is empty.
- The arm64 image builds on the native `ubuntu-24.04-arm` runner, not QEMU.
- A Gemini 429 is detected by `ModelRateLimitError` for chat calls, and by a `ClientError` with code 429 in the exception's cause chain for embedding calls.

- The prod container takes `GOOGLE_API_KEY` from the `gemini_api_key` variable, and the other keys keep their own names.
- Each secret has its own SSM SecureString under `/<project>/agent-service/`, all with `value_wo_version = 1`.
- The container's health check is the same Python one-liner as the Dockerfile `HEALTHCHECK`.
- A test checks that none of the four secret values appear in the task definition.

## Left to the builder

- Module layout inside `agent-service/`.
