import { commands, Disposable, ExtensionContext, window } from "vscode";
import { Schema } from "../common";
import { Constants } from "../constants/constants";
import { ExplorerTreeProvider } from "./explorerTreeProvider";
import * as treeItem from "./treeItem";

class Explorer implements Disposable {
    private disposable: Disposable;
    private explorerTreeProvider: ExplorerTreeProvider;

    constructor(context: ExtensionContext) {
        let subscriptions = [];

        this.explorerTreeProvider = new ExplorerTreeProvider();
        subscriptions.push(window.createTreeView(Constants.cbliteExplorerViewId, { treeDataProvider: this.explorerTreeProvider }));

        this.disposable = Disposable.from(...subscriptions);
    }

    add(database: Schema.Database) {
        let length = this.explorerTreeProvider.addToTree(database);
        if(length > 0) {
            commands.executeCommand('setContext', 'cblite.explorer.show', true);
        }
        
    }

    remove(dbPath: string) {
        let length = this.explorerTreeProvider.removeFromTree(dbPath);
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

export type N1QLItem = treeItem.N1QLItem;
export type DBItem = treeItem.DBItem;
export type DocumentItem = treeItem.DocumentItem;

export default Explorer;