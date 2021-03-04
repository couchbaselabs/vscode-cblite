import { TextDocument, Disposable } from "vscode";
import { DocumentDatabaseBindings } from "./documentDatabaseBindings";
import { DatabaseStatusBarItem } from "./databaseStatusBarItem";

class CbliteWorkspace implements Disposable {
    private disposable: Disposable;

    private documentDatabaseBindings: DocumentDatabaseBindings;
    private databaseStatusBarItem: DatabaseStatusBarItem;

    constructor() {
        let subscriptions = [];

        this.documentDatabaseBindings = new DocumentDatabaseBindings();
        this.databaseStatusBarItem = new DatabaseStatusBarItem(this.documentDatabaseBindings);

        subscriptions.push(this.databaseStatusBarItem);

        this.disposable = Disposable.from(...subscriptions);
    }

    bindDatabaseToDocument(databasePath: string, cbliteDocument: TextDocument): boolean {
        let success = this.documentDatabaseBindings.bindDatabase(cbliteDocument, databasePath);
        if(success) {
            this.databaseStatusBarItem.update();
        }

        return success;
    }

    bindDocIDToDocument(docID: string, cbliteDocument: TextDocument): boolean {
        let success = this.documentDatabaseBindings.bindDocumentID(cbliteDocument, docID);
        if(success) {
            this.databaseStatusBarItem.update();
        }

        return success;
    }

    getDocumentDatabase(cbliteDocument: TextDocument): string | undefined {
        let retVal = this.documentDatabaseBindings.getDatabase(cbliteDocument);
        return retVal === "" ? undefined : retVal;
    }

    getDocumentDocID(cbliteDocument: TextDocument): string | undefined {
        let retVal = this.documentDatabaseBindings.getDocumentID(cbliteDocument);
        return retVal === "" ? undefined : retVal;
    }

    dispose() {
        this.disposable.dispose();
    }
}

export default CbliteWorkspace;