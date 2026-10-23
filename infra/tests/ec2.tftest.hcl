mock_provider "aws" {
  mock_data "aws_ami" {
    defaults = {
      id = "ami-0123456789abcdef0"
    }
  }
}

mock_provider "cloudflare" {
  mock_data "cloudflare_ip_ranges" {
    defaults = {
      ipv4_cidrs = ["173.245.48.0/20"]
    }
  }
}

variables {
  project_name      = "test"
  subnet_ids        = ["subnet-0123456789abcdef0"]
  security_group_id = "sg-0123456789abcdef0"
  ec2_keypair_name  = "test-key"
  ecs_cluster_name  = "test-cluster"
}

run "plans" {
  command = plan

  module {
    source = "./modules/ec2"
  }
}
