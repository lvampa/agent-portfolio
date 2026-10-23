mock_provider "aws" {
  mock_resource "aws_iam_role" {
    defaults = {
      arn = "arn:aws:iam::123456789012:role/test"
    }
  }
}

variables {
  project_name            = "test"
  aws_region              = "us-east-2"
  n8n_basic_auth_active   = true
  n8n_basic_auth_user     = "admin"
  n8n_basic_auth_password = "test-password"
  n8n_encryption_key      = "test-encryption-key"
  n8n_timezone            = "America/New_York"
  n8n_webhook_url         = "https://n8n.example.com"
}

run "plans" {
  command = plan

  module {
    source = "./modules/ecs"
  }
}
