# Infrastructure

Highlights:
- n8n on one arm64 EC2 instance, run by ECS as a single task with cloudflared, Caddy and n8n.
- A Cloudflare Tunnel carries all web traffic. The `cloudflared` sidecar dials out, so no web port is open on the instance.
- The only inbound rule is SSH from your home IP.
- A Cloudflare Access application lets only your home IP reach `admin_hostname`.
- `api_hostname` serves only `/webhook/*`, capped at 4 KB per request and rate limited per IP at the edge.
- `admin_hostname` serves the editor.
- n8n data lives on its own encrypted EBS volume mounted at `/opt/n8n-data`, so replacing the instance keeps it.
- The data volume has daily snapshots kept for 7 days (`n8n_snapshot_retention_count`).
- Back up workflows by downloading them from the editor.
- Restore, re-import, and AMI bump steps are in [the data volume spec](../docs/specs/n8n-data-volume.md).
- The n8n encryption key is a write-only SSM parameter, so it never lands in state.
- The tunnel token is a write-only SSM parameter too, but it is also in state as a sensitive data source value.
- The frontend is a Cloudflare Pages project on the apex `site_hostname`, and `www` redirects to it with a 301.
- The client-info Worker answers `/info` on the apex. Its source is `workers/info/index.js`.

## Technologies

- **AWS** – VPC, EC2, ECS, SSM Parameter Store, Data Lifecycle Manager, S3 (state)
- **OpenTofu** – IaC (`tofu` CLI)
- **Cloudflare** – DNS, HTTPS, Tunnel, Access, rate limiting, Pages, Workers, redirect rules

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

**Cloudflare (tunnel, DNS, Access, rate limit, site):**

| Variable | Meaning |
|----------|---------|
| `cloudflare_api_token` | API token (sensitive). Permissions: Account > Cloudflare Tunnel > Edit, Account > Access: Apps and Policies > Edit, Account > Cloudflare Pages > Edit, Account > Workers Scripts > Edit, Zone > DNS > Edit, Zone > Zone WAF > Edit, Zone > Workers Routes > Edit, Zone > Single Redirect > Edit. |
| `cloudflare_account_id` | Account ID from the Cloudflare dashboard account Overview |
| `cloudflare_zone_id` | Zone ID from Cloudflare dashboard → zone Overview |
| `api_hostname` | Hostname for n8n webhooks, e.g. `api.example.com`. Only `/webhook/*` is served. |
| `admin_hostname` | Hostname for the n8n editor, e.g. `admin.example.com` |
| `rate_limit_requests` | Webhook requests allowed per IP per period (default `10`) |
| `rate_limit_period_seconds` | Rate-limit period and block time (default `10`, the only value the free plan allows) |
| `pages_project_name` | Pages project for the frontend. Changing it replaces the project, which `prevent_destroy` blocks. |
| `site_hostname` | Apex hostname of the frontend, e.g. `example.com`. `www` redirects here. |

Access needs a Zero Trust organization on the account before the first apply.
See `docs/specs/cloudflare-tunnel.md` for the apply order and checks.
The client-info Worker predates tofu and was imported, as in [the Pages and Worker spec](../docs/specs/cloudflare-pages-and-worker.md).

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

Outputs: `ec2_instance_id`, `ec2_elastic_ip`, `ec2_public_dns`, `n8n_data_volume_id`, and `cloudflare_account_id`, `pages_project_name`, `site_url`.
The last three are the GitHub variables `CLOUDFLARE_ACCOUNT_ID`, `CF_PAGES_PROJECT`, and `SITE_URL`, set as in [docs/deploy.md](../docs/deploy.md).
The Elastic IP is only for SSH. Nothing answers on port 80.
SSH in with `ssh -i your-key.pem ec2-user@<ec2_elastic_ip>`.

After the first apply, open `https://<admin_hostname>` right away and create the owner account.
Until then, anyone who reaches the editor can claim it.

## Tests

The tests use mock providers, so they need no AWS or Cloudflare credentials:

```bash
tofu init -backend=false
tofu test
```

## Networking diagram

See [docs/networking.md](./docs/networking.md).
