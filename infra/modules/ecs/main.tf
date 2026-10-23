# ECS cluster for n8n
resource "aws_ecs_cluster" "this" {
  name = "${var.project_name}-cluster"
}

# Task execution role: ECR pull, CloudWatch logs
resource "aws_iam_role" "ecs_execution" {
  name = "${var.project_name}-ecs-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Write-only, so the key never lands in state. Bump value_wo_version to rotate it.
resource "aws_ssm_parameter" "n8n_encryption_key" {
  name             = "/${var.project_name}/n8n/encryption-key"
  type             = "SecureString"
  value_wo         = var.n8n_encryption_key
  value_wo_version = 1
}

resource "aws_iam_role_policy" "ecs_execution_read_encryption_key" {
  name = "read-n8n-encryption-key"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "ssm:GetParameters"
      Resource = aws_ssm_parameter.n8n_encryption_key.arn
    }]
  })
}

# The api host only serves webhooks, so the editor is reachable on the admin host alone.
# The http:// prefix stops Caddy from requesting certificates; Cloudflare terminates HTTPS.
locals {
  caddyfile = <<-EOT
    http://${var.api_hostname} {
      @webhooks path /webhook/* /webhook-test/*
      handle @webhooks {
        reverse_proxy n8n:5678
      }
      handle {
        respond 404
      }
    }

    http://${var.admin_hostname} {
      reverse_proxy n8n:5678
    }
  EOT
}

# Caddyfile is generated in-container so we don't depend on host state when the task starts.
resource "aws_ecs_task_definition" "n8n" {
  family                   = "${var.project_name}-n8n"
  network_mode             = "bridge"
  requires_compatibilities = ["EC2"]
  cpu                      = "512"
  memory                   = "768"
  execution_role_arn       = aws_iam_role.ecs_execution.arn

  volume {
    name      = "n8n-data"
    host_path = "/opt/n8n-data"
  }

  container_definitions = jsonencode([
    {
      name         = "caddy"
      image        = "caddy:2.11.7-alpine"
      essential    = true
      portMappings = [{ containerPort = 80, hostPort = 80, protocol = "tcp" }]
      links        = ["n8n:n8n"]
      environment  = [{ name = "CADDYFILE", value = local.caddyfile }]
      command = [
        "/bin/sh",
        "-c",
        "printf '%s' \"$CADDYFILE\" > /etc/caddy/Caddyfile && exec caddy run --config /etc/caddy/Caddyfile"
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.caddy.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "caddy"
        }
      }
      dependsOn = [{ containerName = "n8n", condition = "START" }]
    },
    {
      name         = "n8n"
      image        = "n8nio/n8n:2.45.3"
      essential    = true
      portMappings = [{ containerPort = 5678, protocol = "tcp" }]
      secrets = [
        { name = "N8N_ENCRYPTION_KEY", valueFrom = aws_ssm_parameter.n8n_encryption_key.name }
      ]
      environment = [
        { name = "N8N_WEBHOOK_URL", value = "https://${var.api_hostname}/" },
        { name = "N8N_EDITOR_BASE_URL", value = "https://${var.admin_hostname}/" },
        { name = "N8N_HOST", value = var.admin_hostname },
        { name = "N8N_PROTOCOL", value = "https" },
        { name = "N8N_PROXY_HOPS", value = "1" },
        { name = "N8N_PUBLIC_API_DISABLED", value = "true" },
        { name = "GENERIC_TIMEZONE", value = var.n8n_timezone },
        { name = "N8N_SECURE_COOKIE", value = "false" }
      ]
      mountPoints = [
        {
          sourceVolume  = "n8n-data"
          containerPath = "/home/node/.n8n"
          readOnly      = false
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.n8n.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "n8n"
        }
      }
    }
  ])
}

resource "aws_cloudwatch_log_group" "n8n" {
  name              = "/ecs/${var.project_name}-n8n"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "caddy" {
  name              = "/ecs/${var.project_name}-caddy"
  retention_in_days = 7
}

# ECS service: one task with Caddy (80) + n8n (5678); Caddy proxies to n8n (no ALB)
# With bridge network mode, task uses host network stack; no network_configuration (awsvpc-only).
resource "aws_ecs_service" "n8n" {
  name            = "${var.project_name}-n8n"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.n8n.arn
  desired_count   = 1
  launch_type     = "EC2"

  # One instance with host port 80 can't run two tasks, so stop the old task before starting the new one.
  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 100
}
