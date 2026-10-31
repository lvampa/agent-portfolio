#!/bin/bash
set -euo pipefail

# The AMI has no swap. A swap file turns a memory spike into a slowdown instead of an OOM kill.
if [ ! -f /swapfile ]; then
  dd if=/dev/zero of=/swapfile bs=1M count=1024
  chmod 600 /swapfile
  mkswap /swapfile
fi
swapon --show=NAME --noheadings | grep -qx /swapfile || swapon /swapfile
grep -q '^/swapfile ' /etc/fstab || echo "/swapfile none swap sw 0 0" >> /etc/fstab

# The volume attaches after the instance boots, and nvmeXn1 numbering is not stable.
# The by-id link is built from the volume ID, so it always points at this volume.
data_device="/dev/disk/by-id/nvme-Amazon_Elastic_Block_Store_${data_volume_id}"
for _ in $(seq 1 60); do
  [ -b "$data_device" ] && break
  sleep 5
done
[ -b "$data_device" ] || { echo "data volume never appeared: $data_device" >&2; exit 1; }

# Only format a blank volume. A restored or migrated volume already has a filesystem.
if [ -z "$(blkid -o value -s TYPE "$data_device")" ]; then
  mkfs.xfs "$data_device"
fi

data_uuid=$(blkid -o value -s UUID "$data_device")
mkdir -p /opt/n8n-data
grep -q "^UUID=$data_uuid " /etc/fstab || echo "UUID=$data_uuid /opt/n8n-data xfs defaults 0 2" >> /etc/fstab
mountpoint -q /opt/n8n-data || mount /opt/n8n-data

# n8n runs as uid 1000. Docker would otherwise create the bind mount owned by root.
chown 1000:1000 /opt/n8n-data

# Keep this last. The ECS agent starts after cloud-init finishes, so the mount above is in place by then.
for line in "ECS_CLUSTER=${ecs_cluster_name}" "ECS_ENABLE_TASK_IAM_ROLE=true"; do
  grep -qxF "$line" /etc/ecs/ecs.config || echo "$line" >> /etc/ecs/ecs.config
done
