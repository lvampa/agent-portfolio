# Cloudflare Tunnel for the n8n origin

## Problem

Port 80 on the Elastic IP accepts traffic from Cloudflare's IP ranges.
Those ranges are shared by every Cloudflare customer.
Anyone can point their own zone at the Elastic IP and send `Host: admin.<domain>`.
That request comes from an allowed range and never touches our zone, so the WAF rule that protects the editor does not run.
The webhook host also has no rate limit and no body cap.

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
- **Admin access.** A WAF custom rule blocks `admin_hostname` unless `ip.src` is in `home_ip_cidr`.
  It matches `http.host wildcard "<admin_hostname>*"`, which is case-insensitive and also catches a Host with a trailing dot or a port.
  [`http.host`](https://developers.cloudflare.com/ruleset-engine/rules-language/fields/reference/http.host/) is the client's raw `Host` header, and the docs do not say it is normalized.
  [`wildcard`](https://developers.cloudflare.com/ruleset-engine/rules-language/operators/) is case-insensitive, and its `*` matches zero or more characters.
  `matches` would be stricter but needs a Business plan.
  It replaced a Cloudflare Access application, which needed a Zero Trust organization for the same IP-only check.
  The n8n DNS records wait for the rule, so the editor is never reachable without it.
  Caddy is the second layer: on the admin host it proxies to n8n only when the client IP from `CF-Connecting-IP` is in `home_ip_cidr`, and answers 403 otherwise.
  n8n's own login is the third.
- **Caddy.** The api host serves `/webhook/*` and `/webhook-test/*`, and everything else is a 404.
  Test webhooks stay public so "Listen for test event" works.
  n8n only answers them while the editor is listening.
  Request bodies on the api host are capped at 4 KB.
  Caddy trusts private ranges as proxies and reads the client IP from `CF-Connecting-IP`.
  It sets `X-Forwarded-For` to that single IP, which is what `N8N_PROXY_HOPS=1` reads.
- **Rate limit.** A `http_ratelimit` ruleset blocks an IP for 10 seconds after 10 requests in 10 seconds on paths starting with `/webhook`, which covers both webhook paths.
  The free plan allows one rule, a 10 second period, and only the path field in the expression.
  So the rule matches the path on the whole zone, not just the api host.
  The editor does not serve those paths, so this does not affect it.
- **Cookie.** `N8N_SECURE_COOKIE=false` is removed.
  It was added when the origin switched to plain HTTP, and browsers reach n8n over HTTPS at the Cloudflare edge, so secure cookies work.

## Secrets and state

- The n8n encryption key is unchanged: ephemeral variable, write-only SSM parameter.
- The tunnel token is written to SSM with `value_wo`, so the SSM resource does not hold it.
- The token is read through the `cloudflare_zero_trust_tunnel_cloudflared_token` data source, which stores it in state as a sensitive value.
  The state bucket is encrypted.
- The tunnel itself has no secret in our config, because Cloudflare generates it for remotely managed tunnels.

## Before apply

1. Add `cloudflare_account_id` to `terraform.tfvars`.
2. Give the API token these permissions:
   - Account > Cloudflare Tunnel > Edit
   - Zone > DNS > Edit
   - Zone > Zone WAF > Edit (covers the editor rule and the rate-limit ruleset)
3. Right after the first apply, open `admin_hostname` and create the n8n owner account.

## Apply order

One `tofu apply` creates everything.
The data source waits for the tunnel, and the SSM parameter waits for the data source.

### Existing deploy with Access in state

A zone has one `http_request_firewall_custom` entry point ruleset, so the rule fails to create if the dashboard already made one.
Add the rule before Access goes, so the editor is never open in between.

1. Look for an existing custom-rules ruleset:
   ```bash
   curl -s -H "Authorization: Bearer $TOFU_TOKEN" "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets" \
     | jq '.result[] | select(.phase == "http_request_firewall_custom") | {id, name, kind}'
   ```
   If one exists, delete it in the dashboard or import it as `cloudflare_ruleset.admin_home_ip` (`zones/<zone_id>/<ruleset_id>`).
   Importing replaces its rules with this one.
2. `tofu apply -target=cloudflare_ruleset.admin_home_ip`.
3. From a non-home IP (a phone on mobile data), `https://<admin_hostname>` shows the Cloudflare block page.
   Do not go on until it does.
4. `tofu apply`, which removes the Access application and policy.

## Verify after apply

- `curl -m 5 http://<elastic ip>/` times out or is refused.
- `ssh` to the Elastic IP still works from the home IP.
- With "Listen for test event" running in the editor, a call to the test URL reaches the workflow.
- `curl -i https://<api_hostname>/` returns 404.
- `curl -i -X POST https://<api_hostname>/webhook/x -d "$(head -c 5000 /dev/zero | tr '\0' a)"` returns 413.
- Twelve quick requests to `https://<api_hostname>/webhook/x` end in 429 or a Cloudflare block page.
- `https://<admin_hostname>` from a non-home IP (phone on mobile data) shows a Cloudflare block page.
- From a non-home IP, each of these returns the Cloudflare block page or Caddy's 403, never n8n:
  ```bash
  curl -si -H 'Host: ADMIN.<domain>' https://<admin_hostname>/
  curl -si -H 'Host: <admin_hostname>.' https://<admin_hostname>/
  curl -si -H 'Host: <admin_hostname>:443' https://<admin_hostname>/
  ```
- `https://<admin_hostname>` from the home IP loads n8n, and login works with the secure cookie.
- The n8n execution log shows real client IPs for webhook calls, not a `172.x` address.
- In the dashboard, the tunnel shows healthy.

Change the free-plan rate limit values only through the two variables.

If the home network has IPv6, the browser may reach the editor over IPv6, which `home_ip_cidr` does not cover.
Open the editor over IPv4, or add the home /64 to the rule.
`home_ip_cidr` is IPv4 only, because the SSH security group rule is.

## Follow-up

A change of home IP locks you out of the editor until you update `home_ip_cidr` and apply.
If that becomes a nuisance, Cloudflare Access with email one-time-PIN login survives it, at the cost of a Zero Trust organization.
