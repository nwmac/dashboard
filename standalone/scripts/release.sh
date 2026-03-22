#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STANDALONE_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$STANDALONE_DIR")"

# Full release: build image, push image, package and push chart
# Usage: DOCKER_REPO=user/steve-server OCI_REGISTRY=docker.io/user ./scripts/release.sh

# Load environment variables from .env file
set -a && source ${PROJECT_ROOT}/.env && set +a

SCRIPT_DIR="$(dirname "$0")"

echo "=== Building container image ==="
"$SCRIPT_DIR/build.sh"

echo ""
echo "=== Pushing container image ==="
"$SCRIPT_DIR/push.sh"

echo ""
echo "=== Packaging and pushing Helm chart ==="
"$SCRIPT_DIR/package-chart.sh"

echo ""
echo "=== Release complete ==="
echo ""
echo "Install with:"
echo "  helm install steve-server oci://\${OCI_REGISTRY}/steve-server --set image.repository=\${DOCKER_REPO}"
