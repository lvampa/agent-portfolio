mock_provider "aws" {
  mock_resource "aws_iam_role" {
    defaults = {
      arn = "arn:aws:iam::123456789012:role/test"
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
    condition     = strcontains(base64decode(aws_instance.ecs.user_data_base64), "chown 1000:1000 /opt/n8n-data")
    error_message = "n8n runs as uid 1000 and must own /opt/n8n-data."
  }

  assert {
    condition     = aws_dlm_lifecycle_policy.n8n_data.policy_details[0].target_tags["Snapshot"] == aws_ebs_volume.n8n_data.tags["Snapshot"]
    error_message = "The snapshot policy must target the data volume's tag."
  }

  assert {
    condition     = !contains(keys(aws_instance.ecs.root_block_device[0].tags), "Snapshot")
    error_message = "The root volume must not carry the snapshot tag, or the policy would snapshot it too."
  }

  assert {
    condition     = aws_ebs_volume.n8n_data.encrypted && aws_ebs_volume.n8n_data.type == "gp3"
    error_message = "The data volume must be encrypted gp3."
  }

  assert {
    condition     = aws_volume_attachment.n8n_data.device_name == "/dev/sdf" && aws_volume_attachment.n8n_data.stop_instance_before_detaching
    error_message = "The attachment must use /dev/sdf and stop the instance before detaching."
  }

  assert {
    condition     = strcontains(base64decode(aws_instance.ecs.user_data_base64), "nvme-Amazon_Elastic_Block_Store_")
    error_message = "user_data must find the data volume by its stable by-id link, not nvmeXn1."
  }
}
