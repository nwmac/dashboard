#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STANDALONE_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$STANDALONE_DIR")"

# Load environment variables from .env file
set -a && source ${PROJECT_ROOT}/.env && set +a

REGISTRY=${OCI_REGISTRY:-""}  # e.g., docker.io/username
REPO=${DOCKER_REPO:-""}       # e.g., username/steve-server

if [ -z "$REGISTRY" ]; then
    echo "Error: OCI_REGISTRY must be set (e.g., docker.io/username)"
    exit 1
fi

cd "$(dirname "$0")/.."

# Update image.repository in values.yaml if DOCKER_REPO is set
if [ -n "$REPO" ]; then
    echo "Setting image.repository to: ${REPO}"
    sed -i.bak "s|^  repository:.*|  repository: \"${REPO}\"|" chart/values.yaml
    rm -f chart/values.yaml.bak
fi

echo "Packaging Helm chart..."
helm package chart/

CHART_FILE=$(ls steve-server-*.tgz | head -1)

echo "Pushing to OCI registry: ${REGISTRY}"
helm push "$CHART_FILE" "oci://${REGISTRY}"

rm -f "$CHART_FILE"
echo "Done."
