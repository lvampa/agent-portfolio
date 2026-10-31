mock_provider "aws" {
  mock_resource "aws_iam_role" {
    defaults = {
      arn = "arn:aws:iam::123456789012:role/test"
    }
  }
}

mock_provider "cloudflare" {}

variables {
  ec2_keypair_name      = "test-key"
  home_ip_cidr          = "203.0.113.7/32"
  n8n_encryption_key    = "test-encryption-key"
  api_hostname          = "api.example.com"
  admin_hostname        = "admin.example.com"
  cloudflare_api_token  = "test-token"
  cloudflare_account_id = "0123456789abcdef0123456789abcdef"
  cloudflare_zone_id    = "fedcba9876543210fedcba9876543210"
}

run "plans" {
  command = plan

  assert {
    condition     = one(cloudflare_zero_trust_access_policy.admin_home_ip.include).ip.ip == var.home_ip_cidr
    error_message = "The admin Access policy must match only the home IP."
  }

  assert {
    condition     = one(cloudflare_zero_trust_access_application.admin.policies).precedence == 1 && cloudflare_zero_trust_access_application.admin.domain == var.admin_hostname
    error_message = "The Access application must cover the admin host and use the home IP policy."
  }

  assert {
    condition     = strcontains(one(cloudflare_ruleset.webhook_rate_limit.rules).expression, "/webhook/") && cloudflare_ruleset.webhook_rate_limit.phase == "http_ratelimit"
    error_message = "The rate limit must target /webhook/ paths."
  }

  assert {
    condition     = length(cloudflare_zero_trust_tunnel_cloudflared_config.n8n.config.ingress) == 3 && cloudflare_zero_trust_tunnel_cloudflared_config.n8n.config.ingress[2].service == "http_status:404"
    error_message = "The tunnel must route the two hostnames and end with a catch-all 404."
  }
}
