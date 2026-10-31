# Cloudflare Tunnel for the n8n origin

## Problem

Port 80 on the Elastic IP accepts traffic from Cloudflare's IP ranges.
Those ranges are shared by every Cloudflare customer.
Anyone can point their own zone at the Elastic IP and send `Host: admin.<domain>`.
That request comes from an allowed range and never touches our zone, so the WAF rule that protects the editor does not run.
The webhook host also has no rate limit, no body cap, and still exposes `/webhook-test/*`.

## Design

A `cloudflared` sidecar in the ECS task dials out to Cloudflare and forwards requests to Caddy.
The instance has no web port open, so there is nothing to reach by IP.

- **Tunnel.** `cloudflare_zero_trust_tunnel_cloudflared` is remotely managed (`config_src = "cloudflare"`).
  Its config sends both hostnames to `http://caddy:80` and everything else to `http_status:404`.
- **DNS.** Both hostnames are proxied CNAMEs to `<tunnel id>.cfargotunnel.com`.
- **Sidecar.** `cloudflare/cloudflared:2026.10.3` runs `tunnel --no-autoupdate run`.
  The token comes from the `TUNNEL_TOKEN` ECS secret, backed by a write-only SSM SecureString.
- **Networking.** The task stays in bridge mode.
  cloudflared reaches Caddy through `links = ["caddy:caddy"]`, the same way Caddy reaches n8n.
  No container maps a port, so nothing listens on the host.
- **Security group.** The port-80 rule and the `cloudflare_ip_ranges` data source are gone.
  The VPC module no longer needs a Cloudflare provider.
  The SSH rule from `home_ip_cidr` stays.
- **Admin access.** A Cloudflare Access application covers `admin_hostname`.
  Its policy uses the `bypass` decision with an `ip` include of `home_ip_cidr`.
  Bypass skips the login page for the home IP, and Access denies everyone else by default.
  An `allow` policy would still ask for an identity, and we do not use a login provider.
  The old zone WAF custom rule is removed.
- **Caddy.** The api host serves `/webhook/*` only, so `/webhook-test/*` is a 404.
  Request bodies on the api host are capped at 4 KB.
  Caddy trusts private ranges as proxies and reads the client IP from `CF-Connecting-IP`.
  It sets `X-Forwarded-For` to that single IP, which is what `N8N_PROXY_HOPS=1` reads.
- **Rate limit.** A `http_ratelimit` ruleset blocks an IP for 10 seconds after 10 requests in 10 seconds on `/webhook/*`.
  The free plan allows one rule, a 10 second period, and only the path field in the expression.
  So the rule matches the path on the whole zone, not just the api host.
  The editor does not serve `/webhook/` paths, so this does not affect it.
- **Cookie.** `N8N_SECURE_COOKIE=false` is removed.
  It was added when the origin switched to plain HTTP, and browsers reach n8n over HTTPS at the Cloudflare edge, so secure cookies work.

## Secrets and state

- The n8n encryption key is unchanged: ephemeral variable, write-only SSM parameter.
- The tunnel token is written to SSM with `value_wo`, so the SSM resource does not hold it.
- The token is read through the `cloudflare_zero_trust_tunnel_cloudflared_token` data source, which stores it in state as a sensitive value.
  The state bucket is encrypted.
- The tunnel itself has no secret in our config, because Cloudflare generates it for remotely managed tunnels.

## Before apply

1. Make sure the account has a Zero Trust organization (dashboard, Zero Trust, pick a team name).
   The free plan covers up to 50 users, and we use none.
   Cloudflare may ask for a payment method during onboarding.
2. Add `cloudflare_account_id` to `terraform.tfvars`.
3. Give the API token these permissions:
   - Account > Cloudflare Tunnel > Edit
   - Account > Access: Apps and Policies > Edit
   - Zone > DNS > Edit
   - Zone > Zone WAF > Edit (covers the rate-limit ruleset and the removed custom rule)
4. Run `tofu plan` and check that the two A records are replaced by CNAMEs and the zone custom rules ruleset is destroyed.
   No `import` is needed.
   If the provider cannot change a record's type in place, it replaces the record, and the hostnames are briefly unresolvable.

## Apply order

One `tofu apply` is enough.
The data source waits for the tunnel, and the SSM parameter waits for the data source.
The ECS task is replaced, and the old task stops first, so n8n is down for a minute or two.
Back up `/opt/n8n-data` first if you want to be safe, though the data volume is not touched.

## Verify after apply

- `curl -m 5 http://<elastic ip>/` times out or is refused.
- `ssh` to the Elastic IP still works from the home IP.
- `curl -i https://<api_hostname>/webhook-test/x` returns 404.
- `curl -i https://<api_hostname>/` returns 404.
- `curl -i -X POST https://<api_hostname>/webhook/x -d "$(head -c 5000 /dev/zero | tr '\0' a)"` returns 413.
- Twelve quick requests to `https://<api_hostname>/webhook/x` end in 429 or a Cloudflare block page.
- `https://<admin_hostname>` from a non-home IP (phone on mobile data) shows an Access block page.
- `https://<admin_hostname>` from the home IP loads n8n, and login works with the secure cookie.
- The n8n execution log shows real client IPs for webhook calls, not a `172.x` address.
- In the dashboard, Zero Trust, Networks, Tunnels shows the tunnel healthy.

If the home IP check fails because Access still shows a login page, switch the policy decision to `allow` and add a login method.
Change the free-plan rate limit values only through the two variables.

## Rollback

Revert the commits and run `tofu apply`.
That restores the port-80 rule, the A records, the WAF custom rule, and the Caddy host port mapping, and destroys the tunnel, Access application, and rate-limit ruleset.
The SSM tunnel parameter is destroyed with it.
Your Elastic IP and n8n data are not affected.

## Follow-up

Add email one-time-PIN login to the Access policy.
That survives a change of home IP, which today locks you out of the editor until you update `home_ip_cidr`.
