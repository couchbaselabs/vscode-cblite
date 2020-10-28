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
        let success = this.documentDatabaseBindings.bind(cbliteDocument, databasePath);
        if(success) {
            this.databaseStatusBarItem.update();
        }

        return success;
    }

    getDocumentDatabase(cbliteDocument: TextDocument): string | undefined {
        return this.documentDatabaseBindings.get(cbliteDocument);
    }

    dispose() {
        this.disposable.dispose();
    }
}

export default CbliteWorkspace;