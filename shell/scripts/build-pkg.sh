#!/usr/bin/env bash

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BASE_DIR="$( cd $SCRIPT_DIR && cd ../.. & pwd)"
SHELL_DIR=$BASE_DIR/shell/

#"vue-cli-service build --name epinio --target lib pkg/epinio/index.js && rm -rf dist-epinio && cp -R dist dist-epinio && cp pkg/epinio/package.json dist-epinio",

PKG_DIST=${BASE_DIR}/dist-pkg/${1}

if [ -d "${BASE_DIR}/pkg/${1}" ]; then
  echo "Building UI Package $1"
  rm -rf ${BASE_DIR}/dist-pkg/${1}
  mkdir -p ${BASE_DIR}/dist-pkg/${1}

  pushd pkg/${1}

  if [ -e ".shell" ]; then
    LINK=$(readlink .shell)
    if [ "${LINK}" != "${SHELL_DIR}" ]; then
      echo ".shell symlink exists but does not point to expected location - please check and fix"
      popd
      exit -1
    fi
  else
    ln -s ${SHELL_DIR} .shell
  fi

  # Check that the .shell link exists and points to the correct place

  ${BASE_DIR}/node_modules/.bin/vue-cli-service build --name ${1} --target lib index.js --dest ${PKG_DIST} --formats umd-min
  # cp -R ${BASE_DIR}/dist/ ${PKG_DIST}/
#  rm ${PKG_DIST}/demo.html
  cp ${SCRIPT_DIR}/package.json ${PKG_DIST}/package.json
  sed -i.bak -e "s/@@NAME/${1}/g" ${PKG_DIST}/package.json
  rm -rf ${PKG_DIST}/*.bak
  rm .shell

  popd  
fi
