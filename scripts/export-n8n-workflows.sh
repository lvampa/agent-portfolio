#!/usr/bin/env bash
# Usage: scripts/export-n8n-workflows.sh [ssh-key]
# Exports every n8n workflow from the instance into n8n/workflows/, one JSON file each.
# Credentials are left out on purpose. Recreate them in the editor after an import.
set -euo pipefail

repo_root=$(cd "$(dirname "$0")/.." && pwd)
host=$(tofu -chdir="$repo_root/infra" output -raw ec2_elastic_ip)
remote="ec2-user@$host"

# The empty-array expansion form keeps bash 3.2 (macOS) happy under set -u.
ssh_opts=()
[ $# -ge 1 ] && ssh_opts=(-i "$1")

ssh ${ssh_opts[@]+"${ssh_opts[@]}"} "$remote" 'set -euo pipefail
  container=$(sudo docker ps -q --filter "label=com.amazonaws.ecs.container-name=n8n")
  [ -n "$container" ] || { echo "n8n container is not running" >&2; exit 1; }
  sudo docker exec "$container" rm -rf /tmp/workflows
  sudo docker exec "$container" mkdir /tmp/workflows
  sudo docker exec "$container" n8n export:workflow --all --separate --pretty --output=/tmp/workflows/
  sudo rm -rf /tmp/workflows
  sudo docker cp "$container":/tmp/workflows /tmp/workflows
  sudo chown -R ec2-user /tmp/workflows'

mkdir -p "$repo_root/n8n/workflows"
scp ${ssh_opts[@]+"${ssh_opts[@]}"} "$remote":/tmp/workflows/*.json "$repo_root/n8n/workflows/"
ssh ${ssh_opts[@]+"${ssh_opts[@]}"} "$remote" 'rm -rf /tmp/workflows'
echo "Exported to n8n/workflows/. Review the diff before committing."
