import { basename } from "path";
import { Command, TreeItem, TreeItemCollapsibleState } from "vscode";

export interface N1QLTree {
    [dbPath: string]: DBItem;
}

export class N1QLItem extends TreeItem {
    constructor(public readonly name: string, public readonly label: string,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public readonly command?: Command) {
            super(label, collapsibleState);
    }
}

export class DBItem extends N1QLItem {
    constructor(public dbPath: string, command?: Command) {
        super(dbPath, basename(dbPath), TreeItemCollapsibleState.Collapsed, command);
        
        this.contextValue = "cblite.databaseItem";
    }

    // @ts-ignore
    get tooltip(): string {
        return this.dbPath;
    }
}

export class DocumentItem extends N1QLItem {
    constructor(readonly id: string, command?: Command) {
        super(id, id, TreeItemCollapsibleState.Collapsed, command);

        this.contextValue = "cblite.documentItem";
    }

    // @ts-ignore
    get tooltip(): string {
        return this.name;
    }
}

export class ValueItem extends N1QLItem {
    constructor(value: any, command?: Command) {
        super(value.toString(), value.toString(), TreeItemCollapsibleState.None, command);

        this.contextValue = "cblite.valueItem";
    }

    // @ts-ignore
    get tooltip(): string {
        return this.name;
    }
}

export class CollectionItem extends N1QLItem {
    constructor(key: string, command?: Command) {
        super(key, key, TreeItemCollapsibleState.Collapsed, command);

        this.contextValue = "cblite.collectionItem";
    }

    // @ts-ignore
    get tooltip(): string {
        return this.name;
    }
}

export class KeyItem extends N1QLItem {
    constructor(key: string, command?: Command) {
        super(key, key, TreeItemCollapsibleState.Collapsed, command);

        this.contextValue = "cblite.keyItem";
    }

    // @ts-ignore
    get tooltip(): string {
        return this.name;
    }
}