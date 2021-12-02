# vscode-cblite README

This is a Visual Studio Code extension for interacting with a Couchbase Lite database.  This includes enumerating documents and running ad-hoc queries.  It is heavily inspired by the [SQLite extension](https://github.com/AlexCovizzi/vscode-sqlite/) that provides similar functionality.

This repo can also be used as a standalone node.js binding for Couchbase Lite for C.  To do so, simply follow the normal process of building as described below.  The file *out/binding/binding.js* can be imported into a node.js application, with the caveat that you must also copy the cblite shared binary (i.e. libcblite.so.3 libcblite.dylib or cblite.dll) into *build/Release* (next to cblite-js.node).

## Requirements

This plugin relies on the Couchbase Lite for C API.  It must either be built or [downloaded](https://www.couchbase.com/downloads?family=couchbase-lite) and places into the *deps* folder as indicated.

## Building

Standard npm practice will build this for you.  `npm compile` will run `webpack` to create the final product *dist/extension.js* and a hashed named for the node addon cblite-js.node.  The Couchbase Lite C shared library must also be copied into this directory for the extension to function (e.g. cblite.dll).  `npm test` will run a test program located in *standalone_test/test.js*.  Note that the shared library for cblite in this case must be in *build/Release*.  

## Extension Settings

This extension contributes the following settings:

* `cblite.logLevel`: The level of logging that is visible in the debug console of VS Code.

## Release Notes

### 0.1.0

Initial release