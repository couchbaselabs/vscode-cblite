#!/bin/bash -e

ROOT="$( cd "$(dirname "$0")" ; pwd -P )/.."
pushd $ROOT

CBL_C_VERSION="3.1.0"
CBL_C_VERSION_SHORT="3.1.0"

case "$OSTYPE" in
    linux*)
        DOWNLOAD_URL="https://packages.couchbase.com/releases/couchbase-lite-c/$CBL_C_VERSION/couchbase-lite-c-enterprise-$CBL_C_VERSION-ubuntu20.04-x86_64.tar.gz"
        DOWNLOAD_FILENAME="cbl.tar.gz"
        EXPAND="tar xf"
        ;;
    darwin*)
        DOWNLOAD_URL="https://packages.couchbase.com/releases/couchbase-lite-c/$CBL_C_VERSION/couchbase-lite-c-enterprise-$CBL_C_VERSION-macos.zip"
        DOWNLOAD_FILENAME="cbl.zip"
        EXPAND="unzip"
        ;;
esac

pushd deps
wget $DOWNLOAD_URL -O $DOWNLOAD_FILENAME
$EXPAND $DOWNLOAD_FILENAME
mv libcblite-$CBL_C_VERSION_SHORT/* .
rmdir libcblite-$CBL_C_VERSION_SHORT
rm $DOWNLOAD_FILENAME
popd

npm install
npm run build-native