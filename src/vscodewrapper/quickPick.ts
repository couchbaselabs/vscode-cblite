import { readdirSync, statSync } from "fs";
import { basename, sep } from "path";
import { CancellationToken, CancellationTokenSource, QuickPickItem, window, workspace } from "vscode";
import { Database } from "../native/binding";

export namespace QuickPick {
    export class DatabaseItem implements QuickPickItem {
        path: string;
        label: string;
        description: string;
        detail?: string;
        picked?: boolean;
        
        constructor(path: string, description?: string) {
            this.path = sep === "/" ? path : path.replace(/\//g, sep);
            this.label = basename(path);
            this.description = description ?? this.path;
        }
    }

    export class CollectionItem implements QuickPickItem {
        label: string;
        detail?: string;
        picked?: boolean;

        constructor(readonly scope: string, readonly name: string) {
            this.label = `${scope}.${name}`;
        }
    }

    export class FileDialogItem implements QuickPickItem {
        label: string;
        description: string;
        detail?: string;
        picked?: boolean;
        
        constructor() {
            this.label = "Choose database from file";
            this.description = "";
        }
    }
    
    export class ErrorItem implements QuickPickItem {
        label: string;
        description?: string;
        detail?: string;
        picked?: boolean;
        
        constructor(label: string) {
            this.label = label;
        }
    }
}

export function pickWorkspaceDatabase(autopick: boolean, hint?: string): Thenable<string> {
    const promise = new Promise<Array<QuickPick.DatabaseItem | QuickPick.ErrorItem | QuickPick.FileDialogItem>>(resolve => {
        let items: Array<QuickPick.DatabaseItem | QuickPick.ErrorItem | QuickPick.FileDialogItem> = [];
        workspace.workspaceFolders?.forEach(wf => {
            items = items.concat(findDatabases(wf.uri.fsPath).map(item => new QuickPick.DatabaseItem(item)));
        });

        items.push(new QuickPick.FileDialogItem);
        resolve(items);
    });

    return new Promise((resolve, reject) => {
        hint = hint ? hint : "Choose a database.";
        showAutoQuickPick(autopick, promise, hint).then(item => {
            if(item instanceof QuickPick.DatabaseItem) {
                resolve(item.path);
            } else if(item instanceof QuickPick.FileDialogItem) {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                window.showOpenDialog({filters: {"Database (.cblite2)": ["cblite2"]}, canSelectFiles: true, canSelectFolders: true}).then(fileUri => {
                    if(fileUri) {
                        resolve(fileUri[0].fsPath);
                    } else {
                        resolve("");
                    }
                });
            } else {
                resolve("");
            }
        });
    });
}

export function pickListCollection(dbObj: Database): Thenable<{scope: string, name: string}> {
    let items: QuickPick.CollectionItem[] = [];
    dbObj.getScopeNames().forEach(scope => {
        dbObj.getCollectionNames(scope).forEach(collection => {
            items.push(new QuickPick.CollectionItem(scope, collection));
        });
    });

    return new Promise((resolve, reject) => {
        showAutoQuickPick(false, items, 'Choose a collection to use.').then(item => {
            if(item instanceof QuickPick.CollectionItem) {
                resolve({scope: item.scope, name: item.name})
            } else {
                reject();
            }
        });
    });
}

export function pickListDatabase(autopick: boolean, dbs: string[]): Thenable<string> {
    let items: QuickPick.DatabaseItem[] | QuickPick.ErrorItem[];
    if(dbs.length === 0) {
        items = [];
    } else {
        items = dbs.map(dbPath => new QuickPick.DatabaseItem(dbPath));
    }

    return new Promise((resolve, reject) => {
        showAutoQuickPick(autopick, items, 'Choose a database to close.').then(item => {
            if(item instanceof QuickPick.DatabaseItem) {
                resolve(item.path);
            } else {
                reject();
            }
        });
    });
}

export function showAutoQuickPick(autopick: boolean, items: QuickPickItem[] | Thenable<QuickPickItem[]>, hint?: string): Thenable<QuickPickItem> {
    if(autopick && items instanceof Array && items.length === 1) {
        let item = items[0];
        return new Promise(resolve => resolve(item));
    }

    return new Promise((resolve, reject) => {
        let cancTokenSource: CancellationTokenSource | undefined;
        let cancToken: CancellationToken | undefined;

        if(autopick && !(items instanceof Array)) {
            cancTokenSource = new CancellationTokenSource();
            cancToken = cancTokenSource.token;

            items.then(items => {
                if (items.length === 1) {
                    let item = items[0];
                    resolve(item);

                    if (cancTokenSource) {
                        cancTokenSource.cancel();
                        cancTokenSource.dispose();
                    }
                }
            });
        }

        window.showQuickPick(items, {placeHolder: hint? hint : ''}, cancToken).then(item => {
            resolve(item!);

            if (cancTokenSource) {
                cancTokenSource.dispose();
            }
        });
    });
}

function findDatabases(location: string) : string[] {
    let results: string[] = [];
    readdirSync(location).forEach(file => {
        if(file.startsWith(".")) {
            return;
        }

        let fullPath = location+'/'+file;
        let stat = statSync(fullPath);
        if(stat && stat.isDirectory()) {
            if(file.endsWith("cblite2")) {
                results.push(fullPath);
            }

            results = results.concat(findDatabases(fullPath));
        }
    });

    return results;
}