#!/bin/bash -e

ROOT="$( cd "$(dirname "$0")" ; pwd -P )/.."
pushd $ROOT

npm install
cmake-js compile -T install