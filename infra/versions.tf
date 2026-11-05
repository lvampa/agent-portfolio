terraform {
  required_version = ">= 1.11.0" # OpenTofu; ephemeral variables and value_wo need 1.11

  backend "s3" {
    bucket       = "ai-agent-portfolio-tfstate"
    key          = "agent/terraform.tfstate"
    region       = "us-east-2"
    encrypt      = true
    use_lockfile = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.69"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.28"
    }
  }
}