mock_provider "cloudflare" {
  mock_resource "cloudflare_pages_project" {
    defaults = {
      subdomain = "portfolio-a1b.pages.dev"
    }
  }
}

variables {
  account_id     = "test-account"
  zone_id        = "test-zone"
  project_name   = "portfolio"
  hostname       = "example.com"
  worker_name    = "info"
  worker_content = "export default {};"
}

# Apply, not plan, so the mocked subdomain is known. It only runs against the mock provider.
run "applies" {
  command = apply

  module {
    source = "./modules/site"
  }

  assert {
    condition     = cloudflare_pages_project.site.production_branch == "main"
    error_message = "The deploy uses --branch=main, so the production branch must be main."
  }

  assert {
    condition     = cloudflare_workers_route.info.pattern == "example.com/info*" && cloudflare_workers_route.info.script == "info"
    error_message = "The info Worker must serve /info on the site's own host."
  }

  assert {
    condition = (
      cloudflare_ruleset.www_redirect.rules[0].expression == "http.host eq \"www.example.com\"" &&
      cloudflare_ruleset.www_redirect.rules[0].action_parameters.from_value.target_url.expression == "concat(\"https://example.com\", http.request.uri.path)" &&
      cloudflare_ruleset.www_redirect.rules[0].action_parameters.from_value.status_code == 301 &&
      cloudflare_ruleset.www_redirect.rules[0].action_parameters.from_value.preserve_query_string
    )
    error_message = "www must 301 to the apex and keep the path and query."
  }

  assert {
    condition     = cloudflare_dns_record.apex.content == "portfolio-a1b.pages.dev" && cloudflare_dns_record.apex.proxied
    error_message = "The apex must be proxied, for the Worker route, and point at the project's real pages.dev subdomain."
  }
}
