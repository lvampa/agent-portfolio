# Agent Portfolio

This repository contains three related projects:

- `portfolio`: Next.js frontend for the portfolio/agent experience.
- `infra`: AWS infrastructure as code for self hosting n8n and portfolio static site.
- `n8n-local`: Docker Compose setup for running n8n + Postgres locally.

## Repository Layout

```text
.
├── portfolio/    # Next.js app
├── infra/        # Terraform/OpenTofu modules for AWS resources
└── n8n-local/    # Local n8n development stack (Docker Compose)
```

## Prerequisites

- Node.js 20+ and npm
- Docker + Docker Compose
- AWS CLI
- OpenTofu

---

## `portfolio` (Frontend App)

The `portfolio` app is a Next.js project that renders a terminal-style UI with a REPL flow and supporting hooks/tests.

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
npm run test

# Build production bundle
npm run build

# Run linting
npm run lint
```

---

## `infra` (AWS Infrastructure)

The `infra` project provisions core AWS resources through modules:

- VPC + public subnets + security group
- EC2 instance (with IAM profile, Elastic IP, and daily disk snapshots)
- ECS cluster running Caddy and n8n on that instance
- Cloudflare DNS records for the api and admin hostnames

### Configure AWS profile

```bash
aws configure --profile portfolio
```

### Configure variables

Update `infra/terraform.tfvars` with your values:

- `ec2_keypair_name`
- `home_ip_cidr` (for SSH access)

### Plan and apply

```bash
cd infra
terraform init
terraform plan
terraform apply
```

If you use OpenTofu, run the same commands with `tofu` instead of `terraform`.

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

Frontend deploys are automated via GitHub Actions. Pushing or merging into the `production` branch:

1. Runs `npm ci` and `npm run build` in `portfolio/`
2. Syncs the built static export (`portfolio/out`) to the S3 bucket with `aws s3 sync ... --delete`

Workflow file: [`.github/workflows/deploy-frontend.yml`](.github/workflows/deploy-frontend.yml).

### Required GitHub secrets

In the repo: **Settings → Secrets and variables → Actions**, add:

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM access key for the deploy user |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key |
| `AWS_REGION` | Bucket region (e.g. `us-east-1`) |
| `S3_BUCKET` | S3 bucket name (from Terraform, e.g. `project_name-frontend`) |

The IAM user must have at least `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`, and `s3:ListBucket` on the frontend bucket.

---

## Recommended Workflow

1. Run `n8n-local` when building or testing workflows locally.
2. Develop UI/API behavior in `portfolio`.
3. Deploy/update cloud resources from `infra` when promoting changes to AWS.