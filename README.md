# vscode-cblite README

This is a Visual Studio Code extension for interacting with a Couchbase Lite database.  This includes enumerating documents and running ad-hoc queries.  It is heavily inspired by the [SQLite extension](https://github.com/AlexCovizzi/vscode-sqlite/) that provides similar functionality.

This repo can also be used as a standalone node.js binding for Couchbase Lite for C.  To do so, simply follow the normal process of building as described below.  The file *out/binding/binding.js* can be imported into a node.js application, with the caveat that you must also copy the cblite shared binary (i.e. libcblite.so.3 libcblite.dylib or cblite.dll) into *build/Release* (next to cblite-js.node).

## Requirements

This plugin relies on the Couchbase Lite for C API.  It must either be built or [downloaded](https://www.couchbase.com/downloads?family=couchbase-lite) and places into the *deps* folder as indicated.

## Building

Standard npm practice will build this for you.  `npm run compile` will run `webpack` to create the final product *dist/extension.js* and copy the node addons for each flavor.  `npm run test` will run a test program located in *standalone_test/test.js*.  Note that due to webpack limitations, all three node addons must be present in order to compile, however they don't have to be valid so a simple `touch` or `New-Item` will do the trick for local testing.  The error message should let you know where the build addons are expected, but just in case they are *out/Windows*, *out/Darwin*, and *out/Linux*.  For the current running system, the npm compile command will build the addon as part of the process.

## Extension Settings

This extension contributes the following settings:

* `cblite.logLevel`: The level of logging that is visible in the debug console of VS Code.

## Release Notes

### 0.1.0

Initial release