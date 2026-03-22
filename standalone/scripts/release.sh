#!/bin/bash
set -e

# Full release: build image, push image, package and push chart
# Usage: DOCKER_REPO=user/steve-server OCI_REGISTRY=docker.io/user ./scripts/release.sh

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
