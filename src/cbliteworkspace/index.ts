import { TextDocument, Disposable } from "vscode";
import { DocumentDatabaseBindings } from "./documentDatabaseBindings";
import { DatabaseStatusBarItem } from "./databaseStatusBarItem";
import { Database, MutableDocument } from "../native/binding";

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

    bindDatabaseToDocument(dbObj: Database, cbliteDocument: TextDocument): boolean {
        let success = this.documentDatabaseBindings.bindDatabase(cbliteDocument, dbObj);
        if(success) {
            this.databaseStatusBarItem.update();
        }

        return success;
    }

    bindDocToDocument(doc: MutableDocument, cbliteDocument: TextDocument): boolean {
        let success = this.documentDatabaseBindings.bindDocument(cbliteDocument, doc);
        if(success) {
            this.databaseStatusBarItem.update();
        }

        return success;
    }

    getDocumentDatabase(cbliteDocument: TextDocument): Database | undefined {
        return this.documentDatabaseBindings.getDatabase(cbliteDocument);
    }

    getDocumentDoc(cbliteDocument: TextDocument): MutableDocument | undefined {
        return this.documentDatabaseBindings.getDocument(cbliteDocument);
    }

    dispose() {
        this.disposable.dispose();
    }
}

export default CbliteWorkspace;