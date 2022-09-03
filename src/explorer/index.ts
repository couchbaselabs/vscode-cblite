import { commands, Disposable, ExtensionContext, window } from "vscode";
import { SchemaDatabase, SchemaDocument } from "../common";
import { Constants } from "../constants/constants";
import { Database } from "../native/binding";
import { ExplorerTreeProvider } from "./explorerTreeProvider";
import * as treeItem from "./treeItem";

type NewType = SchemaDatabase;

class Explorer implements Disposable {
    private disposable: Disposable;
    private explorerTreeProvider: ExplorerTreeProvider;

    constructor(context: ExtensionContext) {
        let subscriptions = [];

        this.explorerTreeProvider = new ExplorerTreeProvider();
        subscriptions.push(window.createTreeView(Constants.cbliteExplorerViewId, { treeDataProvider: this.explorerTreeProvider }));

        this.disposable = Disposable.from(...subscriptions);
    }

    add(database: NewType) {
        let length = this.explorerTreeProvider.addToTree(database);
        if(length > 0) {
            commands.executeCommand('setContext', 'cblite.explorer.show', true);
        }
        
    }

    update(dbObj: Database, document: SchemaDocument): void {
        let schemaDb = this.get(dbObj);
        if(!schemaDb) {
            return;
        }

        let collection = document.parent;
        let scope = collection.parent

        let scopeIndex = schemaDb.scopes.indexOf(scope);
        if(scopeIndex == -1) {
            return;
        }

        scope = schemaDb.scopes[scopeIndex];
        let collectionIndex = scope.collections.indexOf(collection);
        if(collectionIndex == -1) {
            return;
        }

        collection = scope.collections[collectionIndex];


        let index = collection.documents.findIndex(d => d.id === document.id);
        if(index > -1) {
            collection.documents[index] = document;
        } else {
            collection.documents.push(document);
        }

        this.refresh();
    }

    get(dbObj: Database) : SchemaDatabase | undefined {
        return this.explorerTreeProvider.getDatabaseList().find(x => x.obj.path === dbObj.path);
    }

    remove(dbObj: Database) {
        let length = this.explorerTreeProvider.removeFromTree(dbObj);
        if(length === 0) {
            setTimeout(() => {
                commands.executeCommand("setContext", "cblite.explorer.show", false);
            }, 100);
        }
    }

    list() {
        return this.explorerTreeProvider.getDatabaseList();
    }

    refresh() {
        this.explorerTreeProvider.refresh();
    }

    dispose() {
        this.disposable.dispose();
    }
}

export type SqlppItem = treeItem.SqlppItem;
export type DBItem = treeItem.DBItem;
export type DocumentItem = treeItem.DocumentItem;

export default Explorer;