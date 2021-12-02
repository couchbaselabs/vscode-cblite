import { TextDocument } from "vscode";
import { Database, MutableDocument } from "../native/binding";

class DocumentCBLiteInfo {
    db?: Database;
    doc?: MutableDocument;
}

interface Bindings {
    [documentId: string]: DocumentCBLiteInfo
}

export class DocumentDatabaseBindings {
    private bindings: Bindings;

    constructor() {
        this.bindings = {};
    }

    bindDatabase(document: TextDocument | undefined, dbObj: Database): boolean {
        if(document) {
            let key = document.uri.toString();
            if(!(key in this.bindings)) {
                this.bindings[key] = new DocumentCBLiteInfo();
            }

            this.bindings[document.uri.toString()].db = dbObj;
            return true;
        }

        return false;
    }

    bindDocument(document: TextDocument | undefined, cblDocument: MutableDocument): boolean {
        if(document) {
            let key = document.uri.toString();
            if(!(key in this.bindings)) {
                this.bindings[key] = new DocumentCBLiteInfo();
            }

            this.bindings[document.uri.toString()].doc = cblDocument;
            return true;
        }

        return false;
    }

    getDatabase(document: TextDocument | undefined): Database | undefined {
        if(document) {
            return this.bindings[document.uri.toString()]?.db;
        }

        return undefined;
    }

    getDocument(document: TextDocument | undefined): MutableDocument | undefined {
        if(document) {
            return this.bindings[document.uri.toString()]?.doc;
        }

        return undefined;
    }

    unbindDatabase(dbObj: Database) {
        Object.keys(this.bindings).forEach((docId) => {
            if(this.bindings[docId].db === dbObj) {
                this.bindings[docId].db = undefined;
                if(!this.bindings[docId].doc) {
                    delete this.bindings[docId];
                }
            }
        });
    }

    unbindDocument(doc: MutableDocument) {
        Object.keys(this.bindings).forEach((docId) => {
            if(this.bindings[docId].doc === doc) {
                this.bindings[docId].doc = undefined;
                if(!this.bindings[docId].db) {
                    delete this.bindings[docId];
                }
            }
        });
    }
}