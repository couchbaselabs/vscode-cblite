import { Schema } from "../common";
import { Event, EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from "vscode";
import { DBItem, DocumentItem, KeyItem, ShowMoreItem, ValueItem } from "./treeItem";

export class ExplorerTreeProvider implements TreeDataProvider<Schema.Item> {
    private _onDidChangeTreeData: EventEmitter<Schema.Item | undefined> = new EventEmitter<Schema.Item | undefined>();
    readonly onDidChangeTreeData: Event<Schema.Item | undefined> = this._onDidChangeTreeData.event;

    private databaseList: Schema.Database[];

    constructor() {
        this.databaseList = [];
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    addToTree(database: Schema.Database): Number {
        let index = this.databaseList.findIndex(db => db.path === database.path);
        if(index < 0) {
            this.databaseList.push(database);
        } else {
            this.databaseList[index] = database;
        }

        this.refresh();
        return this.databaseList.length;
    }

    removeFromTree(dbPath: string): Number {
        let index = this.databaseList.findIndex(db => db.path === dbPath);
        if(index > -1) {
            this.databaseList.splice(index, 1);
        }

        this.refresh();
        return this.databaseList.length;
    }

    getTreeItem(item: Schema.Item): TreeItem {
        if('documents' in item) {
            return new DBItem(item.path);
        } else if('keys' in item) {
            return new DocumentItem(item.id);
        } else if('name' in item) {
            return new KeyItem(item.name);
        } else if(!('value' in item)) {
            return new ShowMoreItem(item.parent, this);
        }

        return new ValueItem(item.value);
    }

    getDatabaseList() {
        return this.databaseList;
    }

    getChildren(item?: Schema.Item): ProviderResult<Schema.Item[]> {
        if(item) {
            if('documents' in item) {
                if(item.limit < item.documents.length) {
                    var l = [];
                    l.push(... item.documents.slice(0, item.limit))
                    l.push({parent: item} as Schema.ShowMore);
                    return l;
                } else {
                    return item.documents;
                }
            } else if('keys' in item) {
                return item.keys;
            } else if('array' in item) {
                return item.array!;
            } else if('dict' in item) {
                return item.dict!;
            } else if('scalar' in item) {
                return [item.scalar!];
            }

            return undefined;
        } else {
            return this.databaseList;
        }
    }
}