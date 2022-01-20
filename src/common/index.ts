import { ShowMoreItem } from "../explorer/treeItem";
import { openDbAtPath } from "../utils/files";
import { Database, MutableDocument, QueryLanguage } from "../native/binding";

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

export async function buildSchema(dbPath: string): Promise<SchemaDatabase | undefined> {
    let db = await openDbAtPath(dbPath);
    if(!db) {
        return undefined;
    }

    let query = db.createQuery(QueryLanguage.N1QL, "SELECT *, meta().id FROM _");
    let results = query.execute();

    let schema = {
        obj: db,
        documents: [],
        limit: ShowMoreItem.batchSize
    } as SchemaDatabase;

    if(results.length === 0) {
        return schema;   
    }

    results.forEach(raw => {
        let r = raw["_"];
        let doc: SchemaDocument = {
            id: raw["id"],
            keys: [],
            parent: schema
        };

        for(let key in r) {
            recursiveBuild(doc, doc.keys, r[key], key);
        }

        schema.documents.push(doc);
    });

    return schema;
}

export function buildDocumentSchema(db: SchemaDatabase, doc: MutableDocument) : SchemaDocument {
    let schemaDoc: SchemaDocument = {
        parent: db,
        id: doc.id,
        keys: []
    };

    let content = JSON.parse(doc.propertiesAsJSON());
    for(let key in content) {
        recursiveBuild(schemaDoc, schemaDoc.keys, content[key], key);
    }

    return schemaDoc;
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
        if(value === null) {
            return null;
        }

        return typeof value === "bigint" ? value.toString() + "n" : value;
    });
}