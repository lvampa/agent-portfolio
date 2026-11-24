# shellcheck shell=bash
# Shared settings and Pinecone helpers for the training-data scripts. Sourced, not run.

: "${INDEX_NAME:=portfolio-rag}" "${NAMESPACE:=portfolio}"
# The index is a legacy vector index, so it's read and written through the vectors API.
API_VERSION="2025-04"

require_tools() {
  local tool
  for tool in "$@"; do
    command -v "$tool" >/dev/null || fail "$tool is required"
  done
}

require_api_key() {
  [[ -n "${PINECONE_API_KEY:-}" ]] || fail "PINECONE_API_KEY is not set"
}

pinecone() {
  curl -sS --fail-with-body \
    -H "Api-Key: $PINECONE_API_KEY" \
    -H "X-Pinecone-Api-Version: $API_VERSION" \
    "$@"
}

index_host() {
  pinecone "https://api.pinecone.io/indexes/$INDEX_NAME" | jq -er '.host'
}

fail() {
  echo "error: $1" >&2
  exit 1
}
