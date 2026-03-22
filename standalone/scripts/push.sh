#!/bin/bash
set -e

REPO=${DOCKER_REPO:-""}
TAG=${TAG:-"latest"}

if [ -z "$REPO" ]; then
    echo "Error: DOCKER_REPO must be set (e.g., username/steve-server)"
    exit 1
fi

echo "Pushing container image: ${REPO}:${TAG}"
docker push "${REPO}:${TAG}"

echo "Done."
