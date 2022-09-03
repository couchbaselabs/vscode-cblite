import { SchemaDatabase, SchemaItem, ShowMore } from "../common";
import { Event, EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from "vscode";
import { DBItem, DocumentItem, KeyItem, ShowMoreItem, ValueItem } from "./treeItem";
import { Database } from "../native/binding";

export class ExplorerTreeProvider implements TreeDataProvider<SchemaItem> {
    private _onDidChangeTreeData: EventEmitter<SchemaItem | undefined> = new EventEmitter<SchemaItem | undefined>();
    readonly onDidChangeTreeData: Event<SchemaItem | undefined> = this._onDidChangeTreeData.event;

    private databaseList: SchemaDatabase[];

    constructor() {
        this.databaseList = [];
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    addToTree(database: SchemaDatabase): Number {
        let index = this.databaseList.findIndex(db => db.obj === database.obj);
        if(index < 0) {
            this.databaseList.push(database);
        } else {
            this.databaseList[index] = database;
        }

        this.refresh();
        return this.databaseList.length;
    }

    removeFromTree(dbObj: Database): Number {
        let index = this.databaseList.findIndex(db => db.obj === dbObj);
        if(index > -1) {
            this.databaseList.splice(index, 1);
        }

        this.refresh();
        return this.databaseList.length;
    }

    getTreeItem(item: SchemaItem): TreeItem {
        if('documents' in item) {
            return new DBItem(item.obj.path);
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

    getChildren(item?: SchemaItem): ProviderResult<SchemaItem[]> {
        if(item) {
            if('documents' in item) {
                if(item.limit < item.documents.length) {
                    var l = [];
                    l.push(... item.documents.slice(0, item.limit));
                    l.push({parent: item} as ShowMore);
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