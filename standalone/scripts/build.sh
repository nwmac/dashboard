#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STANDALONE_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$STANDALONE_DIR")"

REPO=${DOCKER_REPO:-""}
TAG=${TAG:-"latest"}

if [ -z "$REPO" ]; then
    echo "Error: DOCKER_REPO must be set (e.g., username/steve-server)"
    exit 1
fi

# Check if dist folder exists in project root
if [ ! -d "$PROJECT_ROOT/dist" ]; then
    echo "Error: dist folder not found at $PROJECT_ROOT/dist"
    echo "Run 'yarn build' from the project root first"
    exit 1
fi

# Copy dist folder to standalone directory for Docker build
echo "Copying UI dist files..."
rm -rf "$STANDALONE_DIR/dist"
cp -r "$PROJECT_ROOT/dist" "$STANDALONE_DIR/dist"

echo "Building container image: ${REPO}:${TAG}"
docker build -t "${REPO}:${TAG}" "$STANDALONE_DIR"

# Clean up copied dist folder
rm -rf "$STANDALONE_DIR/dist"

echo "Done. Run './scripts/push.sh' to push to Docker Hub"
