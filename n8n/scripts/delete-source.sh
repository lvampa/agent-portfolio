#!/usr/bin/env bash
# Deletes every chunk of one training file from Pinecone, so the file can be re-uploaded without duplicates.
#
# Usage:
#   PINECONE_API_KEY comes from .env via direnv, or: read -rs PINECONE_API_KEY && export PINECONE_API_KEY
#   ./n8n/scripts/delete-source.sh cv.md
set -euo pipefail
# shellcheck source-path=SCRIPTDIR source=lib.sh
source "$(dirname "$0")/lib.sh"

main() {
  [[ -n "${1:-}" ]] || fail "usage: $0 <file name, e.g. cv.md>"
  # Chunks are tagged with the bare file name, so a path like training-data/cv.md still works.
  local source_name
  source_name="$(basename "$1")"

  require_tools curl jq
  require_api_key
  confirm_delete "$source_name"

  delete_chunks "$(index_host)" "$source_name"
  echo "Deleted chunks with source=$source_name from $INDEX_NAME / $NAMESPACE."
  echo "Pinecone is eventually consistent, so counts can lag for up to a minute."
}

confirm_delete() {
  local answer
  read -rp "Delete all chunks with source=$1 from $INDEX_NAME / $NAMESPACE? [y/N] " answer
  [[ "$answer" == [yY] ]] || fail "cancelled"
}

delete_chunks() {
  local host="$1" source_name="$2" body
  body="$(jq -nc --arg namespace "$NAMESPACE" --arg source "$source_name" \
    '{namespace: $namespace, filter: {source: {"$eq": $source}}}')"
  pinecone -X POST "https://$host/vectors/delete" \
    -H "Content-Type: application/json" \
    -d "$body" >/dev/null
}

main "$@"
