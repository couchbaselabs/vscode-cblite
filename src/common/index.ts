import { executeCommand } from "../cblite/cblite";
import { ShowMoreItem } from "../explorer/treeItem";
import { isDirectorySync } from "../utils/files";

export type Schema = Schema.Database;

export namespace Schema {
    export type Item = Database | Document | Key | Value | ShowMore;

    export interface ShowMore {
        parent: Database
    }

    export interface Database {
        path: string,
        documents: Schema.Document[];
        limit: number;
    }

    export interface Document {
        id: string,
        keys: Schema.Key[],
        parent: Database
    }

    export interface Key {
        name: string,
        parent: Key|Document,
        scalar?: Schema.Value,
        array?: Schema.Value[],
        dict?: Schema.Key[]
    }

    export interface Value {
        parent: Key,
        value: any
    }

    export function build(dbPath: string, cblite: string): Promise<Schema.Database> {
        return new Promise(async (resolve, reject) => {
            if(!isDirectorySync(dbPath)) {
                return reject(`Failed to retrieve database schema: '${dbPath}' is not a cblite2 folder.`);
            }       

            var allDocs = await executeCommand(cblite, ["ls", "--raw", dbPath]);
            if(allDocs.error) {
                return reject(allDocs.error);
            }

            let schema = {
                path: dbPath,
                documents: [],
                limit: ShowMoreItem.BATCH_SIZE
            } as Database;

            if(allDocs.results === "(No documents)") {
                return resolve(schema);   
            }

            let allDocsBody = allDocs.results?.split("\n").map(line => JSON.parse(line))!;
            allDocsBody.forEach(b => {
                let doc: Document = {
                    id: b["_id"],
                    keys: [],
                    parent: schema
                };

                for(let key in b) {
                    recursiveBuild(doc, doc.keys, b[key], key);
                }

                schema.documents.push(doc);
            });
            
            return resolve(schema);
        });
    }

    function recursiveBuild(owner: Document|Key, collection: any[], item: any, key?: string): void {
        if(key === "_id") {
            return;
        }

        if(Array.isArray(item)) {
            let c: Key = {
                name: key!,
                array: [],
                parent: owner
            };

            item.forEach((val) => {
                recursiveBuild(c, c.array!, val);
            });

            collection.push(c);
        } else if(item?.constructor == Object) {
            let c: Key = {
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
                let toInsert = {name: key, parent: owner} as Key;
                toInsert.scalar = {value: item, parent: toInsert};
                collection.push(toInsert);
            } else {
                collection.push({value: item, parent: owner} as Value);
            }
        }
    }
}