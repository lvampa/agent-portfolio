terraform {
  required_version = ">= 1.6.0" # OpenTofu

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