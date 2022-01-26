//import { Schema } from "inspector";
import { basename, join } from "path";
import { Command, TreeItem, TreeItemCollapsibleState } from "vscode";
import { SchemaDatabase } from "../common";
import { ExplorerTreeProvider } from "./explorerTreeProvider";

export interface SqlppTree {
    [dbPath: string]: DBItem;
}

export class SqlppItem extends TreeItem {
    constructor(public readonly name: string, public readonly label: string,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public readonly command?: Command) {
            super(label, collapsibleState);
    }
}

export class DBItem extends SqlppItem {
    constructor(public dbPath: string, command?: Command) {
        super(dbPath, basename(dbPath), TreeItemCollapsibleState.Collapsed, command);
        
        this.contextValue = "cblite.databaseItem";
        this.iconPath = {
            light: join(__dirname, "..", "resources", "icon", "light", "bucket.svg"),
            dark: join(__dirname, "..", "resources", "icon", "dark", "bucket.svg")
        };
    }

    // @ts-ignore
    get tooltip(): string {
        return this.dbPath;
    }
}

export class DocumentItem extends SqlppItem {
    constructor(readonly id: string, command?: Command) {
        super(id, id, TreeItemCollapsibleState.Collapsed, command);

        this.contextValue = "cblite.documentItem";
        this.iconPath = {
            light: join(__dirname, "..", "resources", "icon", "light", "documents.svg"),
            dark: join(__dirname, "..", "resources", "icon", "dark", "documents.svg")
        };
    }

    // @ts-ignore
    get tooltip(): string {
        return this.name;
    }
}

export class ValueItem extends SqlppItem {
    constructor(value: any, command?: Command) {
        super(value ? value.toString() : "(null)", value ? value.toString() : "(null)", TreeItemCollapsibleState.None, command);

        this.contextValue = "cblite.valueItem";
    }

    // @ts-ignore
    get tooltip(): string {
        return this.name;
    }
}

export class CollectionItem extends SqlppItem {
    constructor(key: string, command?: Command) {
        super(key, key, TreeItemCollapsibleState.Collapsed, command);

        this.contextValue = "cblite.collectionItem";
    }

    // @ts-ignore
    get tooltip(): string {
        return this.name;
    }
}

export class KeyItem extends SqlppItem {
    constructor(key: string, command?: Command) {
        super(key, key, TreeItemCollapsibleState.Collapsed, command);

        this.contextValue = "cblite.keyItem";
    }

    // @ts-ignore
    get tooltip(): string {
        return this.name;
    }
}

export class ShowMoreItem extends TreeItem {
    static readonly batchSize = 50;

    readonly parent: SchemaDatabase;
    readonly tree: ExplorerTreeProvider;
    
    constructor(parent: SchemaDatabase, tree: ExplorerTreeProvider) {
        super("Show More...", TreeItemCollapsibleState.None);

        this.parent = parent;
        this.tree = tree;
        this.contextValue = "cblite.showMoreItem";
        this.command = {title: "", command: "cblite.explorer.showMoreItems", arguments: [this] };
    }

    showMore() {
        this.parent.limit += ShowMoreItem.batchSize;
        this.tree.refresh();
    }

    // @ts-ignore
    get tooltip(): string {
        return "Show More...";
    }
}