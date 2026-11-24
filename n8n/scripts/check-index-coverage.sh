#!/usr/bin/env bash
# Reports what's in the Pinecone namespace and which training-data headings are missing from it.
#
# Usage:
#   PINECONE_API_KEY comes from .env via direnv, or: read -rs PINECONE_API_KEY && export PINECONE_API_KEY
#   ./n8n/scripts/check-index-coverage.sh
#
# Optional overrides: INDEX_NAME (default portfolio-rag), NAMESPACE (default portfolio),
# TRAINING_DIR (default n8n-local/training-data at the repo root).
set -euo pipefail
# shellcheck source-path=SCRIPTDIR source=lib.sh
source "$(dirname "$0")/lib.sh"

TRAINING_DIR="${TRAINING_DIR:-$(cd "$(dirname "$0")/../.." && pwd)/n8n-local/training-data}"
FETCH_BATCH_SIZE=50

main() {
  require_tools curl jq
  require_api_key

  local host
  host="$(index_host)"
  RECORDS_FILE="$(mktemp)"
  trap 'rm -f "$RECORDS_FILE"' EXIT

  fetch_all_records "$host" >"$RECORDS_FILE"
  report_sources "$RECORDS_FILE"
  report_missing_headings "$RECORDS_FILE"
}

# Prints one JSON object per record: {"source": ..., "text": ...}
fetch_all_records() {
  local host="$1"
  list_record_ids "$host" | fetch_in_batches "$host"
}

list_record_ids() {
  local host="$1" token="" page
  while :; do
    page="$(pinecone "https://$host/vectors/list?namespace=$NAMESPACE&limit=100${token:+&paginationToken=$token}")"
    jq -r '.vectors[]?.id' <<<"$page"
    token="$(jq -r '.pagination.next // empty' <<<"$page")"
    [[ -n "$token" ]] || break
  done
}

fetch_in_batches() {
  local host="$1" batch=()
  while read -r id; do
    batch+=("ids=$id")
    if ((${#batch[@]} == FETCH_BATCH_SIZE)); then
      fetch_batch "$host" "${batch[@]}"
      batch=()
    fi
  done
  if ((${#batch[@]} > 0)); then
    fetch_batch "$host" "${batch[@]}"
  fi
}

fetch_batch() {
  local host="$1"
  shift
  local query
  query="$(IFS='&'; echo "$*")"
  pinecone "https://$host/vectors/fetch?namespace=$NAMESPACE&$query" |
    jq -c '.vectors[] | {source: .metadata.source, text: .metadata.text}'
}

report_sources() {
  local records="$1"
  echo "== Chunks per source in $INDEX_NAME / $NAMESPACE =="
  jq -r '.source // "(no source)"' "$records" | sort | uniq -c
  echo
}

report_missing_headings() {
  local records="$1" file name source_text missing
  echo "== Training-data headings missing from the index =="
  source_text="$(mktemp)"

  for file in "$TRAINING_DIR"/*.md; do
    name="$(basename "$file")"
    jq -r --arg source "$name" 'select(.source == $source) | .text' "$records" >"$source_text"

    if [[ ! -s "$source_text" ]]; then
      echo "$name: not in the index at all"
      continue
    fi

    missing="$(missing_headings "$file" "$source_text")"
    if [[ -z "$missing" ]]; then
      echo "$name: all headings present"
    else
      echo "$name: missing"
      echo "$missing"
    fi
  done

  rm -f "$source_text"
}

missing_headings() {
  local file="$1" source_text="$2" heading
  grep -E '^#{1,3} ' "$file" | while IFS= read -r heading; do
    grep -Fxq -- "$heading" "$source_text" || echo "  $heading"
  done
}

main "$@"
