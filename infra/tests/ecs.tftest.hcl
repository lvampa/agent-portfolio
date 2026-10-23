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
        for e in try(c.environment, []) : e.name != "N8N_ENCRYPTION_KEY"
      ]
    ]))
    error_message = "The encryption key must not be a plain environment variable."
  }

  assert {
    condition     = aws_ecs_service.n8n.deployment_minimum_healthy_percent == 0 && aws_ecs_service.n8n.deployment_maximum_percent == 100
    error_message = "One instance with host port 80 can't run two tasks, so the old task must stop first."
  }

  assert {
    condition     = strcontains({ for e in one([for c in jsondecode(aws_ecs_task_definition.n8n.container_definitions) : c if c.name == "caddy"]).environment : e.name => e.value }["CADDYFILE"], "@webhooks path /webhook/* /webhook-test/*")
    error_message = "The api host must only proxy webhook paths."
  }
}
