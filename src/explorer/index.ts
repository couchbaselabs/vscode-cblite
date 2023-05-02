import { commands, Disposable, ExtensionContext, window } from "vscode";
import { SchemaCollection, SchemaDatabase, SchemaDocument } from "../common";
import { Constants } from "../constants/constants";
import { Collection, Database } from "../native/binding";
import { ExplorerTreeProvider } from "./explorerTreeProvider";
import * as treeItem from "./treeItem";
import { ShowMoreItem } from "./treeItem";

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
            commands.executeCommand('cblite.explorer.focus');
        }
        
    }

    addCollection(schemaDb: SchemaDatabase, c: Collection): void {
        let scopeIndex = schemaDb.scopes.findIndex(s => s.name == c.scopeName);
        if(scopeIndex == -1) {
            scopeIndex = schemaDb.scopes.length;
            schemaDb.scopes.push({
                name: c.scopeName,
                collections: [],
                parent: schemaDb
            });
        }

        let schemaScope = schemaDb.scopes[scopeIndex];
        if(schemaDb.scopes.findIndex(col => col.name == c.name) != -1) {
            return;
        }

        schemaScope.collections.push({
            obj: c,
            documents: [],
            limit: ShowMoreItem.batchSize,
            parent: schemaScope
        });

        this.refresh();
    }

    removeCollection(c: SchemaCollection): void {
        let schemaScope = c.parent;
        let collectionIndex = schemaScope.collections.indexOf(c);
        if(collectionIndex == -1) {
            return;
        }

        schemaScope.collections.splice(collectionIndex, 1);
        if(schemaScope.collections.length === 0) {
            let scopeIndex = schemaScope.parent.scopes.indexOf(schemaScope);
            if(scopeIndex == -1) {
                return;
            }

            schemaScope.parent.scopes.splice(scopeIndex, 1);
        }

        this.refresh();
    }

    update(collection: SchemaCollection, document: SchemaDocument): void {
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

    getCollection(dbObj: Database, c: Collection) : SchemaCollection | undefined {
        let db = this.get(dbObj);
        if(!db) {
            return undefined;
        }

        let sIndex = db.scopes.findIndex(s => s.name == c.scopeName);
        if(sIndex == -1) {
            return undefined;
        }

        let schemaScope = db.scopes[sIndex];
        let cIndex = schemaScope.collections.findIndex(col => col.obj.name == c.name);
        if(cIndex == -1) {
            return undefined;
        }

        return schemaScope.collections[cIndex];
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