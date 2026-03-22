#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STANDALONE_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$STANDALONE_DIR")"

# Load environment variables from .env file
set -a && source ${PROJECT_ROOT}/.env && set +a

REPO=${DOCKER_REPO:-""}
TAG=${TAG:-"latest"}

if [ -z "$REPO" ]; then
    echo "Error: DOCKER_REPO must be set (e.g., username/steve-server)"
    exit 1
fi

echo "Pushing container image: ${REPO}:${TAG}"
docker push "${REPO}:${TAG}"

echo "Done."
