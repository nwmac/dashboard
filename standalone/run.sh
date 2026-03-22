#!/bin/bash
set -e

ROOT_DIR=$(cd $(dirname $0)/..; pwd)

export KUBECONFIG=${ROOT_DIR}/dev-cluster.yaml

pushd ${ROOT_DIR}/standalone
go build
popd

${ROOT_DIR}/standalone/uibackend --debug --ui-path=${ROOT_DIR}/dist