Push-Location $PSScriptRoot/..

$CBL_C_VERSION = "3.0.0"
$CBL_C_VERSION_SHORT = "3.0.0"
$DOWNLOAD_URL = "https://packages.couchbase.com/releases/couchbase-lite-c/$CBL_C_VERSION/couchbase-lite-c-enterprise-$CBL_C_VERSION-windows-x86_64.zip"

Push-Location deps
Invoke-WebRequest $DOWNLOAD_URL -OutFile cbl.zip
Expand-Archive cbl.zip -DestinationPath $pwd
Copy-Item -Recurse libcblite-$CBL_C_VERSION_SHORT/* .
Remove-Item -Recurse libcblite-$CBL_C_VERSION_SHORT/*
Remove-Item cbl.zip
Pop-Location

npm install
npm run build-native

Pop-Location