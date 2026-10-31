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
}

# Bypass skips the login page for the home IP, and Access denies everyone else by default.
# An Allow policy would still ask for an identity.
resource "cloudflare_zero_trust_access_policy" "admin_home_ip" {
  account_id = var.cloudflare_account_id
  name       = "${var.project_name} admin from home IP"
  decision   = "bypass"

  include = [{
    ip = { ip = var.home_ip_cidr }
  }]
}

resource "cloudflare_zero_trust_access_application" "admin" {
  account_id = var.cloudflare_account_id
  name       = "${var.project_name} n8n editor"
  domain     = var.admin_hostname
  type       = "self_hosted"

  policies = [{
    id         = cloudflare_zero_trust_access_policy.admin_home_ip.id
    precedence = 1
  }]
}

# The free plan allows one rule, a 10 second period and only the path field in the expression,
# so the rule cannot be limited to the api host. The editor never serves /webhook/ paths.
# Cloudflare allows one rate-limit ruleset per zone, so rules added in the dashboard would be overwritten here.
resource "cloudflare_ruleset" "webhook_rate_limit" {
  zone_id = var.cloudflare_zone_id
  name    = "Webhook rate limit"
  kind    = "zone"
  phase   = "http_ratelimit"

  rules = [{
    description = "Rate limit webhooks per IP"
    expression  = "starts_with(http.request.uri.path, \"/webhook/\")"
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
