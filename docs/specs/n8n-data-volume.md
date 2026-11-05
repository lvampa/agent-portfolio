# n8n data volume

## Problem

n8n keeps its SQLite file in `/opt/n8n-data`, which used to sit on the instance's root volume.
Replacing the instance (an AMI bump, or any `user_data` change) destroyed the root volume and the data with it.
`user_data.sh` also appended to `fstab` on every run, and script edits never reached the running host.
There was no restore procedure, and the workflows were not in git.

## Design

- A separate `aws_ebs_volume.n8n_data` (gp3, encrypted, `size` from `n8n_data_volume_size_gib`, default 10) in the instance's AZ.
- The volume has `prevent_destroy = true`, so `tofu destroy` and any plan that replaces it fail.
- `aws_volume_attachment.n8n_data` attaches it as `/dev/sdf` with `stop_instance_before_detaching = true`, so a replacement never yanks a mounted filesystem.
- `user_data.sh` finds the disk through `/dev/disk/by-id/nvme-Amazon_Elastic_Block_Store_<volume id without the dash>`.
  On Nitro instances `/dev/sdf` shows up as `/dev/nvmeXn1`, and the number is not stable across boots.
  The by-id link is built from the volume ID, which EBS exposes as the NVMe serial number.
- The script waits up to five minutes for the volume, because the attachment is created after the instance.
- It runs `mkfs.xfs` only if `blkid` finds no filesystem, mounts by UUID at `/opt/n8n-data`, and writes `fstab` only if the line is missing.
- The ECS agent config is written last.
  The agent starts after cloud-init finishes, and `set -e` aborts the script on a failed mount, so no task starts without the data.
- The script is safe to re-run: swap file, `fstab`, mount, and `ecs.config` are all guarded.
- `user_data_replace_on_change = true` on the instance, so script edits now replace the instance and the plan matches reality.
- The DLM policy still targets the tag `Snapshot=n8n-data`, but only the data volume carries it now, not the root volume.
  Schedule is daily at 05:00 with `n8n_snapshot_retention_count` snapshots kept (default 7).
- Cross-region snapshot copy is not set up.
  It is a follow-up if losing `us-east-2` ever matters.
- The DLM policy has no `prevent_destroy`.
  It is cheap to recreate, and the snapshots it made are kept when it goes.
- Workflows are backed up by downloading them from the editor.
  Downloads do not include credentials.

## Verify after the first apply

- SSH in and check `findmnt /opt/n8n-data` and `grep n8n-data /etc/fstab`.
- After 05:00 UTC, check that `aws ec2 describe-snapshots --region us-east-2 --filters Name=tag:Snapshot,Values=n8n-data` shows a snapshot.

## Restoring from a DLM snapshot

Use this if the volume is corrupted or the data is wrong.
`prevent_destroy` stops Tofu from swapping the volume, so the swap is done by hand and the state is updated to match.

1. Pick the snapshot: `aws ec2 describe-snapshots --region us-east-2 --filters Name=tag:Snapshot,Values=n8n-data --query 'sort_by(Snapshots,&StartTime)[].[SnapshotId,StartTime]'`.
2. Find the AZ of the instance (`aws ec2 describe-volumes --volume-ids <current data volume id> --query 'Volumes[0].AvailabilityZone'`).
3. Create the volume in that AZ, with the same tag so backups continue:
   `aws ec2 create-volume --region us-east-2 --availability-zone <az> --snapshot-id <snap> --volume-type gp3 --tag-specifications 'ResourceType=volume,Tags=[{Key=Snapshot,Value=n8n-data},{Key=Name,Value=ai-agent-portfolio-n8n-data}]'`.
   An encrypted snapshot restores to an encrypted volume.
4. Stop n8n: set the ECS service `--desired-count 0`, then stop the instance.
5. Detach the old volume: `aws ec2 detach-volume --volume-id <old id>`.
6. Update the state.
   - You run: `tofu state rm module.ec2.aws_volume_attachment.n8n_data module.ec2.aws_ebs_volume.n8n_data`.
   - You run: `tofu import module.ec2.aws_ebs_volume.n8n_data <new volume id>`.
7. You run: `tofu apply`.
   The volume ID is in `user_data`, so the instance is replaced and mounts the restored volume.
8. Check the editor.
   Then remove the old volume: `aws ec2 delete-volume --volume-id <old id>`.
   Until you do, it still carries the snapshot tag.

## Re-importing workflows

Use this on a fresh instance with an empty data volume, or if a workflow was deleted.

1. In the editor, create a workflow and use Import from File with a downloaded workflow.
2. Imported workflows start inactive.
   Activate each one after checking it.
3. Credentials are not in the downloads.
   Recreate them in the editor, then re-link them in the workflows that use them.

## AMI bump

1. Take a manual snapshot of the data volume: `aws ec2 create-snapshot --region us-east-2 --volume-id <data volume id>`.
2. Download any workflows that changed since the last backup.
3. Update `ami_id` in `modules/ec2`, using the SSM command in the variable's description.
4. You run: `tofu plan`.
   Check that only the instance, attachment, and EIP association are replaced, and the data volume is untouched.
5. You run: `tofu apply`.
   Expect a few minutes of downtime while the new instance boots and mounts the volume.
6. Check the editor, then delete the manual snapshot when you are done.

## Sources

- AWS, "Map Amazon EBS volumes to NVMe device names": https://docs.aws.amazon.com/ebs/latest/userguide/identify-nvme-ebs-device.html
- n8n, "Export and import workflows": https://docs.n8n.io/workflows/export-import/
