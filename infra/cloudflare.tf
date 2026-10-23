# Both hostnames point at the Elastic IP; Caddy routes by host.
resource "cloudflare_dns_record" "n8n" {
  for_each = toset([var.api_hostname, var.admin_hostname])

  zone_id = var.cloudflare_zone_id
  name    = each.value
  type    = "A"
  content = module.ec2.public_ip
  ttl     = 1
  proxied = true
}

# Cloudflare allows one custom-rules ruleset per zone, so rules added in the dashboard would be overwritten here.
resource "cloudflare_ruleset" "zone_custom_rules" {
  zone_id = var.cloudflare_zone_id
  name    = "Custom rules"
  kind    = "zone"
  phase   = "http_request_firewall_custom"

  rules = [{
    description = "Admin host only from home IP"
    expression  = "(http.host eq \"${var.admin_hostname}\" and not ip.src in {${var.home_ip_cidr}})"
    action      = "block"
    enabled     = true
  }]
}
