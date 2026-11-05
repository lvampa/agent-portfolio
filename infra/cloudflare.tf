locals {
  hostnames = toset([var.api_hostname, var.admin_hostname])
}

# Remotely managed: the ingress rules below live in Cloudflare and the API generates the tunnel secret.
resource "cloudflare_zero_trust_tunnel_cloudflared" "n8n" {
  account_id = var.cloudflare_account_id
  name       = "${var.project_name}-n8n"
  config_src = "cloudflare"
}

# Both hostnames go to Caddy, which routes by Host header.
resource "cloudflare_zero_trust_tunnel_cloudflared_config" "n8n" {
  account_id = var.cloudflare_account_id
  tunnel_id  = cloudflare_zero_trust_tunnel_cloudflared.n8n.id

  config = {
    ingress = concat(
      [for hostname in [var.api_hostname, var.admin_hostname] : {
        hostname = hostname
        service  = "http://caddy:80"
      }],
      [{ service = "http_status:404" }]
    )
  }
}

# The token lands in state (sensitive); the S3 backend is encrypted.
data "cloudflare_zero_trust_tunnel_cloudflared_token" "n8n" {
  account_id = var.cloudflare_account_id
  tunnel_id  = cloudflare_zero_trust_tunnel_cloudflared.n8n.id
}

resource "cloudflare_dns_record" "n8n" {
  for_each = local.hostnames

  zone_id = var.cloudflare_zone_id
  name    = each.value
  type    = "CNAME"
  content = "${cloudflare_zero_trust_tunnel_cloudflared.n8n.id}.cfargotunnel.com"
  ttl     = 1
  proxied = true

  # Without DNS the tunnel's admin ingress is unreachable, so a failed rule create never leaves the editor public.
  depends_on = [cloudflare_ruleset.admin_home_ip]
}

# Only the home IP may open the editor. Every request arrives through the tunnel, so the check has to happen at Cloudflare.
# Cloudflare allows one custom-rules ruleset per zone, so rules added in the dashboard would be overwritten here.
resource "cloudflare_ruleset" "admin_home_ip" {
  zone_id = var.cloudflare_zone_id
  name    = "n8n editor from home IP only"
  kind    = "zone"
  phase   = "http_request_firewall_custom"

  rules = [{
    description = "Block the n8n editor except from the home IP"
    expression  = "http.host eq \"${var.admin_hostname}\" and not ip.src in {${var.home_ip_cidr}}"
    action      = "block"
    enabled     = true
  }]
}

# The free plan allows one rule, a 10 second period and only the path field in the expression,
# so the rule cannot be limited to the api host. The prefix covers /webhook/ and /webhook-test/,
# and the editor never serves either.
# Cloudflare allows one rate-limit ruleset per zone, so rules added in the dashboard would be overwritten here.
resource "cloudflare_ruleset" "webhook_rate_limit" {
  zone_id = var.cloudflare_zone_id
  name    = "Webhook rate limit"
  kind    = "zone"
  phase   = "http_ratelimit"

  rules = [{
    description = "Rate limit webhooks per IP"
    expression  = "starts_with(http.request.uri.path, \"/webhook\")"
    action      = "block"
    enabled     = true
    ratelimit = {
      # The API rejects rate-limit rules whose characteristics leave out cf.colo.id.
      characteristics     = ["cf.colo.id", "ip.src"]
      period              = var.rate_limit_period_seconds
      requests_per_period = var.rate_limit_requests
      mitigation_timeout  = var.rate_limit_period_seconds
    }
  }]
}
