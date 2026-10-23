mock_provider "aws" {
  mock_resource "aws_iam_role" {
    defaults = {
      arn = "arn:aws:iam::123456789012:role/test"
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

  assert {
    condition     = aws_instance.ecs.metadata_options[0].http_tokens == "required"
    error_message = "IMDSv2 must be required."
  }

  assert {
    condition     = aws_instance.ecs.metadata_options[0].http_put_response_hop_limit == 1
    error_message = "Bridge-mode containers must not reach the instance metadata service."
  }

  assert {
    condition     = strcontains(base64decode(aws_instance.ecs.user_data_base64), "chown 1000:1000 /opt/n8n-data")
    error_message = "n8n runs as uid 1000 and must own /opt/n8n-data."
  }

  assert {
    condition     = aws_instance.ecs.root_block_device[0].tags["Snapshot"] == "n8n-data"
    error_message = "The root volume must carry the tag the snapshot policy targets."
  }

  assert {
    condition     = aws_dlm_lifecycle_policy.n8n_data.policy_details[0].target_tags["Snapshot"] == "n8n-data"
    error_message = "The snapshot policy must target the root volume's tag."
  }

  assert {
    condition     = aws_dlm_lifecycle_policy.n8n_data.policy_details[0].schedule[0].retain_rule[0].count == 7
    error_message = "Keep 7 daily snapshots."
  }
}
