mock_provider "aws" {
  mock_resource "aws_iam_role" {
    defaults = {
      arn = "arn:aws:iam::123456789012:role/test"
    }
  }
}

variables {
  project_name       = "test"
  aws_region         = "us-east-2"
  n8n_encryption_key = "test-encryption-key"
  tunnel_token       = "test-tunnel-token"
  n8n_timezone       = "America/New_York"
  api_hostname       = "api.example.com"
  admin_hostname     = "admin.example.com"
}

run "plans" {
  command = plan

  module {
    source = "./modules/ecs"
  }

  assert {
    condition = alltrue(flatten([
      for c in jsondecode(aws_ecs_task_definition.n8n.container_definitions) : [
        for e in try(c.environment, []) : !contains(["N8N_ENCRYPTION_KEY", "TUNNEL_TOKEN"], e.name)
      ]
    ]))
    error_message = "The encryption key and tunnel token must not be plain environment variables."
  }

  assert {
    condition     = !strcontains(aws_ecs_task_definition.n8n.container_definitions, "test-tunnel-token")
    error_message = "The tunnel token value must not appear anywhere in the task definition, including a command."
  }

  assert {
    condition     = contains([for s in one([for c in jsondecode(aws_ecs_task_definition.n8n.container_definitions) : c if c.name == "cloudflared"]).secrets : s.name], "TUNNEL_TOKEN")
    error_message = "cloudflared must get the tunnel token as an ECS secret."
  }

  assert {
    condition = alltrue([
      for c in jsondecode(aws_ecs_task_definition.n8n.container_definitions) : length(try(c.portMappings, [])) == 0
    ])
    error_message = "No container may map a port, so nothing listens on the host."
  }

  assert {
    condition     = aws_ecs_service.n8n.deployment_minimum_healthy_percent == 0 && aws_ecs_service.n8n.deployment_maximum_percent == 100
    error_message = "Two tasks would share the SQLite files, so the old task must stop first."
  }

  assert {
    condition     = strcontains({ for e in one([for c in jsondecode(aws_ecs_task_definition.n8n.container_definitions) : c if c.name == "caddy"]).environment : e.name => e.value }["CADDYFILE"], "@webhooks path /webhook/*\n")
    error_message = "The api host must only proxy /webhook/ paths, not /webhook-test/."
  }
}
