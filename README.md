# Agent Portfolio

This repository contains three related projects:

- `portfolio`: Next.js frontend for the portfolio/agent experience.
- `infra`: OpenTofu code for self hosting n8n on AWS behind Cloudflare.
- `n8n-local`: Docker Compose setup for running n8n + Postgres locally.

## Repository Layout

```text
.
├── portfolio/    # Next.js app
├── infra/        # OpenTofu modules for AWS and Cloudflare resources
└── n8n-local/    # Local n8n development stack (Docker Compose)
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

## `n8n-local` (Local n8n Stack)

`n8n-local` runs n8n with a Postgres backing database via Docker Compose.

### Environment variables

Create or update `n8n-local/.env` with:

- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `N8N_HOST`
- `N8N_PORT`
- `N8N_PROTOCOL`
- `N8N_CORS_ORIGIN`
- `NODE_ENV`

### Start the stack

```bash
cd n8n-local
docker compose up -d
```

n8n is exposed on `http://localhost:5678`.

### Stop the stack

```bash
docker compose down
```

---

## Deployments

Merging to `main` deploys the frontend to Cloudflare Pages.
See [`docs/deploy.md`](docs/deploy.md) for how it works, how to redeploy, and how to roll back.

---

## Recommended Workflow

1. Run `n8n-local` when building or testing workflows locally.
2. Develop UI/API behavior in `portfolio`.
3. Deploy/update cloud resources from `infra` when promoting changes to AWS.
