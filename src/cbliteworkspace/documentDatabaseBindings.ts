import { TextDocument } from "vscode";

class DocumentCBLiteInfo {
    databaseName?: string;
    documentName?: string;
}

interface Bindings {
    [documentId: string]: DocumentCBLiteInfo
}

export class DocumentDatabaseBindings {
    private bindings: Bindings;

    constructor() {
        this.bindings = {};
    }

    bindDatabase(document: TextDocument | undefined, dbPath: string): boolean {
        if(document) {
            let key = document.uri.toString();
            if(!(key in this.bindings)) {
                this.bindings[key] = new DocumentCBLiteInfo();
            }

            this.bindings[document.uri.toString()].databaseName = dbPath;
            return true;
        }

        return false;
    }

    bindDocumentID(document: TextDocument | undefined, id: string): boolean {
        if(document) {
            let key = document.uri.toString();
            if(!(key in this.bindings)) {
                this.bindings[key] = new DocumentCBLiteInfo();
            }

            this.bindings[document.uri.toString()].documentName = id;
            return true;
        }

        return false;
    }

    getDatabase(document: TextDocument | undefined): string | undefined {
        if(document) {
            return this.bindings[document.uri.toString()]?.databaseName;
        }

        return undefined;
    }

    getDocumentID(document: TextDocument | undefined): string | undefined {
        if(document) {
            return this.bindings[document.uri.toString()]?.documentName;
        }

        return undefined;
    }

    unbindDatabase(dbPath: string) {
        Object.keys(this.bindings).forEach((docId) => {
            if(this.bindings[docId].databaseName === dbPath) {
                this.bindings[docId].databaseName = undefined;
                if(!this.bindings[docId].documentName) {
                    delete this.bindings[docId];
                }
            }
        });
    }

    unbindDocumentID(docId: string) {
        Object.keys(this.bindings).forEach((docId) => {
            if(this.bindings[docId].documentName === docId) {
                this.bindings[docId].documentName = undefined;
                if(!this.bindings[docId].databaseName) {
                    delete this.bindings[docId];
                }
            }
        });
    }
}