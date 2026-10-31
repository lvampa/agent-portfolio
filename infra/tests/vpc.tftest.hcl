mock_provider "aws" {}

variables {
  project_name = "test"
  home_ip_cidr = "203.0.113.7/32"
}

run "plans" {
  command = plan

  module {
    source = "./modules/vpc"
  }

  assert {
    condition = (
      aws_security_group_rule.ssh.from_port == 22 &&
      aws_security_group_rule.ssh.to_port == 22 &&
      aws_security_group_rule.ssh.cidr_blocks == tolist(["203.0.113.7/32"])
    )
    error_message = "SSH must be the only ingress, and only from the home IP. Web traffic comes through the tunnel."
  }
}
