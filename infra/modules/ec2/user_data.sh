#!/bin/bash
set -e

# The instance has 1 GiB of RAM and no swap. A swap file turns a memory spike into a slowdown instead of an OOM kill.
dd if=/dev/zero of=/swapfile bs=1M count=1024
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo "/swapfile none swap sw 0 0" >> /etc/fstab

# n8n runs as uid 1000. Docker would otherwise create the bind mount owned by root.
mkdir -p /opt/n8n-data
chown 1000:1000 /opt/n8n-data

# Register with ECS cluster
echo "ECS_CLUSTER=${ecs_cluster_name}" >> /etc/ecs/ecs.config
echo "ECS_ENABLE_TASK_IAM_ROLE=true" >> /etc/ecs/ecs.config
