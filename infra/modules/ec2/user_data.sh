#!/bin/bash
set -e

# n8n runs as uid 1000. Docker would otherwise create the bind mount owned by root.
mkdir -p /opt/n8n-data
chown 1000:1000 /opt/n8n-data

# Register with ECS cluster
echo "ECS_CLUSTER=${ecs_cluster_name}" >> /etc/ecs/ecs.config
echo "ECS_ENABLE_TASK_IAM_ROLE=true" >> /etc/ecs/ecs.config
