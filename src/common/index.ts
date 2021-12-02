import { ShowMoreItem } from "../explorer/treeItem";
import { isDirectorySync } from "../utils/files";
import { Database, DatabaseConfiguration, QueryLanguage } from "../native/binding";
import { basename, dirname } from "path";

export type SchemaItem = SchemaDatabase | SchemaDocument | SchemaKey | SchemaValue | ShowMore;

export interface ShowMore {
    parent: SchemaDatabase
}

export interface SchemaDatabase {
    obj: Database,
    documents: SchemaDocument[];
    limit: number;
}

export interface SchemaDocument {
    id: string,
    keys: SchemaKey[],
    parent: SchemaDatabase
}

export interface SchemaKey {
    name: string,
    parent: SchemaKey|SchemaDocument,
    scalar?: SchemaValue,
    array?: SchemaValue[],
    dict?: SchemaKey[]
}

export interface SchemaValue {
    parent: SchemaKey,
    value: any
}

export type Schema = SchemaDatabase;

export function buildSchema(dbPath: string, upgrade: boolean): Promise<SchemaDatabase> {
    return new Promise(async (resolve, reject) => {
        if(!isDirectorySync(dbPath)) {
            return reject(`Failed to retrieve database schema: '${dbPath}' is not a cblite2 folder.`);
        }       

        let config: DatabaseConfiguration = new DatabaseConfiguration();
        config.directory = dirname(dbPath);
        let filename = basename(dbPath).split(".")[0];
        let db: Database;
        try {
             db = new Database(filename, config);
        } catch(err: any) {
            return reject("Failed to open database");
        }

        let query = db.createQuery(QueryLanguage.N1QL, "SELECT * FROM _");
        let results = query.execute();

        let schema = {
            obj: db,
            documents: [],
            limit: ShowMoreItem.batchSize
        } as SchemaDatabase;

        if(results.length === 0) {
            return resolve(schema);   
        }

        results.forEach(raw => {
            let r = raw["_"];
            let doc: SchemaDocument = {
                id: r._id,
                keys: [],
                parent: schema
            };

            for(let key in r) {
                recursiveBuild(doc, doc.keys, r[key], key);
            }

            schema.documents.push(doc);
        });
        
        return resolve(schema);
    });
}

function recursiveBuild(owner: SchemaDocument|SchemaKey, collection: any[], item: any, key?: string): void {
    if(key === "_id") {
        return;
    }

    if(Array.isArray(item)) {
        let c: SchemaKey = {
            name: key!,
            array: [],
            parent: owner
        };

        item.forEach((val) => {
            recursiveBuild(c, c.array!, val);
        });

        collection.push(c);
    } else if(item?.constructor === Object) {
        let c: SchemaKey = {
            name: key!,
            dict: [],
            parent: owner
        };

        for(let k in item) {
            recursiveBuild(c, c.dict!, item[k], k);
        }

        collection.push(c);
    } else {
        if(key) {
            let toInsert = {name: key, parent: owner} as SchemaKey;
            toInsert.scalar = {value: item, parent: toInsert};
            collection.push(toInsert);
        } else {
            collection.push({value: item, parent: owner} as SchemaValue);
        }
    }
}

export function stringify(obj: any): string {
    return JSON.stringify(obj, (key, value) => {
        return typeof value === "bigint" ? value.toString() + "n" : value;
    });
}