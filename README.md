# Agent Portfolio

This repository contains three related projects:

- `portfolio`: Next.js frontend for the portfolio/agent experience.
- `infra`: OpenTofu code for self hosting n8n on AWS behind Cloudflare.
- `agent-service`: Python FastAPI and LangGraph chat agent that n8n calls.

## Repository Layout

```text
.
├── portfolio/      # Next.js app
├── infra/          # OpenTofu modules for AWS and Cloudflare resources
├── agent-service/  # Python chat agent (FastAPI + LangGraph)
├── compose.yaml    # Local stack: n8n, Postgres, agent service
├── n8n/scripts/    # Pinecone helpers for the training data
└── n8n-local/      # Workflow exports and training data (local only)
```

## Prerequisites

- Node.js 20.9+ and npm
- Docker + Docker Compose
- AWS CLI
- OpenTofu

---

## `portfolio` (Frontend App)

The `portfolio` app is a Next.js project that renders a terminal-style UI with a REPL flow.
It is built as a static export and talks to n8n webhooks.
See [`portfolio/README.md`](portfolio/README.md) for env vars, scripts, and how the terminal is built.

### Run locally

```bash
cd portfolio
npm install
npm run dev
```

Open `http://localhost:3000`.

### Useful commands

```bash
# Run Jest tests
npm test

# Build the static export into out/
npm run build

# Run linting
npm run lint
```

---

## `infra` (AWS Infrastructure)

The `infra` project provisions n8n on AWS through modules:

- VPC + public subnets + security group
- One arm64 EC2 instance (with IAM profile, Elastic IP, and an n8n data volume with daily snapshots)
- An ECS task on that instance running cloudflared, Caddy, and n8n
- A Cloudflare Tunnel, DNS records, a WAF rule that limits the editor to the home IP, and rate limiting for the webhooks

Webhooks are served at `agent.connorabdelnoor.com` (only `/webhook/*` and `/webhook-test/*`).
The n8n editor is served at `admin.connorabdelnoor.com`.
See [`infra/README.md`](infra/README.md) for variables, state bucket setup, and tests.

### Configure AWS profile

```bash
aws configure --profile portfolio
```

### Configure variables

Set the required values in `infra/terraform.tfvars`, for example `ec2_keypair_name`, `home_ip_cidr`, `api_hostname`, and `admin_hostname`.
The full list is in `infra/README.md`.

### Plan and apply

```bash
cd infra
tofu init
tofu plan
tofu apply
```

---

## Local stack

`compose.yaml` at the repo root runs n8n with a Postgres database, and the agent service, via Docker Compose.
If you have the old layout, move `n8n-local/.env` to `.env` at the root.

### Environment variables

Create or update `.env` at the repo root with:

- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `N8N_HOST`
- `N8N_PORT`
- `N8N_PROTOCOL`
- `N8N_CORS_ORIGIN`
- `NODE_ENV`
- `GOOGLE_API_KEY`
- `PINECONE_API_KEY`
- `LANGSMITH_API_KEY`

The agent service also reads its system prompt from the gitignored `agent-service/system-prompt.local.md`.

### Start the stack

```bash
docker compose up -d
```

n8n is exposed on `http://localhost:5678`.

While editing the agent service, run `docker compose watch` instead.
It syncs `agent-service/src` into the container, where uvicorn reloads, and rebuilds the image when `pyproject.toml`, `uv.lock`, or the `Dockerfile` changes.
Saving the prompt file restarts the service so it picks up the new prompt.
For editor autocomplete, point your Python interpreter at `agent-service/.venv` (run `uv sync` in `agent-service/` first).

### Stop the stack

```bash
docker compose down
```

### Training data

Training files live in the gitignored `n8n-local/training-data/` and are uploaded one at a time through the n8n form.
The scripts in `n8n/scripts/` read `PINECONE_API_KEY` from your shell (`read -rs PINECONE_API_KEY && export PINECONE_API_KEY`):

- `check-index-coverage.sh` lists chunks per file and any headings missing from the index.
- `delete-source.sh <file>` deletes one file's chunks, for example before re-uploading it.

---

## Deployments

Merging to `main` deploys the frontend to Cloudflare Pages.
See [`docs/deploy.md`](docs/deploy.md) for how it works, how to redeploy, and how to roll back.

---

## Recommended Workflow

1. Run the local stack (`docker compose up -d`) when building or testing workflows locally.
2. Develop UI/API behavior in `portfolio`.
3. Deploy/update cloud resources from `infra` when promoting changes to AWS.
