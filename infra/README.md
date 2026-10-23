# Infrastructure

Highlights:
- n8n on one arm64 EC2 instance, run by ECS as a single task with Caddy and n8n.
- Cloudflare terminates HTTPS and forwards plain HTTP to the instance.
- Port 80 only accepts Cloudflare's IP ranges, and SSH only accepts your home IP.
- `api_hostname` serves only n8n webhooks, and `admin_hostname` serves the editor.
- n8n data lives on the instance disk at `/opt/n8n-data`, with daily snapshots kept for 7 days.
- The n8n encryption key is a write-only SSM parameter, so it never lands in state.

## Technologies

- **AWS** – VPC, EC2, ECS, SSM Parameter Store, Data Lifecycle Manager, S3 (state)
- **OpenTofu** – IaC (`tofu` CLI)
- **Cloudflare** – DNS, HTTPS

## Setup

Set the required variables in `terraform.tfvars`, or another `*.tfvars` file.
Real `*.tfvars` files are in `.gitignore`.

### Variables

Set these in `terraform.tfvars` (or your chosen `*.tfvars` file).

**Required (AWS / access):**

| Variable | Meaning |
|----------|---------|
| `ec2_keypair_name` | Name of the EC2 key pair used for SSH. Key pairs are per region, so create it in `us-east-2`. |
| `home_ip_cidr` | Your IP in CIDR form (e.g. `1.2.3.4/32`) so the security group allows SSH only from you |

**Cloudflare (DNS records for both hostnames):**

| Variable | Meaning |
|----------|---------|
| `cloudflare_api_token` | API token with DNS edit on the zone (sensitive) |
| `cloudflare_zone_id` | Zone ID from Cloudflare dashboard → zone Overview |
| `api_hostname` | Hostname for n8n webhooks, e.g. `api.example.com`. Only `/webhook/*` and `/webhook-test/*` are served. |
| `admin_hostname` | Hostname for the n8n editor, e.g. `admin.example.com` |

**n8n (app config, sensitive):**

| Variable | Meaning |
|----------|---------|
| `n8n_encryption_key` | Key used by n8n for encrypting credentials (required, sensitive) |
| `n8n_timezone` | Timezone for n8n (default `"America/New_York"`) |

### State bucket

State lives in the S3 bucket `ai-agent-portfolio-tfstate`.
Create it once per AWS account, before the first `tofu init` in `infra/`:

```bash
tofu -chdir=bootstrap init
tofu -chdir=bootstrap apply
```

## Run

From `infra/`:

```bash
tofu init
tofu plan
tofu apply
```

Outputs: `ec2_instance_id`, `ec2_elastic_ip`, `ec2_public_dns`.
SSH in with `ssh -i your-key.pem ec2-user@<ec2_elastic_ip>`.

After the first apply, open `https://<admin_hostname>` right away and create the owner account.
Until then, anyone who reaches the editor can claim it.

## Tests

The tests use mock providers, so they need no AWS credentials:

```bash
tofu init -backend=false
tofu test
```

## Networking diagram

![Networking Diagram](./docs/networking.jpg)
