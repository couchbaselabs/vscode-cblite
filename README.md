# vscode-cblite README

This is a Visual Studio Code extension for interacting with a Couchbase Lite database.  This includes enumerating documents and running ad-hoc queries.  It is heavily inspired by the [SQLite extension](https://github.com/AlexCovizzi/vscode-sqlite/) that provides similar functionality.

## Requirements

This plugin relies on the unofficial cblite tool created by Couchbase, which can be found in the [mobile tools](https://github.com/couchbaselabs/couchbase-mobile-tools) repo.  The tool must either be in your system path, or specified in the extension settings.

## Extension Settings

This extension contributes the following settings:

* `cblite.cblite`: The command to execute (or the path to the binary) for cblite
* `cblite.logLevel`: The level of logging that is visible in the debug console of VS Code.

## Release Notes

### 0.1.0

Initial release