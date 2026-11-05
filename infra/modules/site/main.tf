resource "cloudflare_pages_project" "site" {
  account_id        = var.account_id
  name              = var.project_name
  production_branch = "main"

  lifecycle {
    # Replacing the project deletes every deployment, and with them Pages rollback.
    prevent_destroy = true
  }
}

resource "cloudflare_pages_domain" "apex" {
  account_id   = var.account_id
  project_name = cloudflare_pages_project.site.name
  name         = var.hostname
}

resource "cloudflare_dns_record" "apex" {
  zone_id = var.zone_id
  name    = var.hostname
  type    = "CNAME"
  # The pages.dev subdomain gets a random suffix when the name is taken, so it is read, not built.
  content = cloudflare_pages_project.site.subdomain
  ttl     = 1
  proxied = true

  # A CNAME to pages.dev before Pages knows the domain returns 522.
  depends_on = [cloudflare_pages_domain.apex]
}

# The redirect answers every www request at the edge, so the target only has to be proxied.
resource "cloudflare_dns_record" "www" {
  zone_id = var.zone_id
  name    = "www.${var.hostname}"
  type    = "CNAME"
  content = var.hostname
  ttl     = 1
  proxied = true
}

# Cloudflare allows one redirect ruleset per zone, so rules added in the dashboard would be overwritten here.
resource "cloudflare_ruleset" "www_redirect" {
  zone_id = var.zone_id
  name    = "Redirect www to apex"
  kind    = "zone"
  phase   = "http_request_dynamic_redirect"

  rules = [{
    description = "Redirect www to apex"
    expression  = "http.host eq \"www.${var.hostname}\""
    action      = "redirect"
    enabled     = true
    action_parameters = {
      from_value = {
        status_code           = 301
        preserve_query_string = true
        target_url = {
          expression = "concat(\"https://${var.hostname}\", http.request.uri.path)"
        }
      }
    }
  }]
}

resource "cloudflare_workers_script" "info" {
  account_id         = var.account_id
  script_name        = var.worker_name
  content            = var.worker_content
  main_module        = "index.js"
  compatibility_date = "2026-11-01"
}

resource "cloudflare_workers_route" "info" {
  zone_id = var.zone_id
  pattern = "${var.hostname}/info*"
  script  = cloudflare_workers_script.info.script_name

  # Pages may refuse a custom domain on a host that already has a Worker route.
  depends_on = [cloudflare_pages_domain.apex]
}
