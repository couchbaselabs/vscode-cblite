import { DocumentDatabaseBindings } from "./documentDatabaseBindings";
import { StatusBarItem, window, StatusBarAlignment, Disposable, workspace } from "vscode";
import { basename } from "path";

export class DatabaseStatusBarItem implements Disposable {
    private disposable: Disposable;
    private statusBarItem: StatusBarItem;

    constructor(private documentDatabase: DocumentDatabaseBindings) {
        let subscriptions: Disposable[] = [];

        this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 100);
        this.statusBarItem.command = "cblite.useDatabase";
        subscriptions.push(this.statusBarItem);

        subscriptions.push(window.onDidChangeActiveTextEditor(e => this.update()));
        subscriptions.push(window.onDidChangeTextEditorViewColumn(e => this.update()));
        subscriptions.push(workspace.onDidOpenTextDocument(e => this.update()));
        subscriptions.push(workspace.onDidCloseTextDocument(e => this.update()));

        this.disposable = Disposable.from(...subscriptions);
    }

    update() {
        let doc = window.activeTextEditor && 
            (window.activeTextEditor.document.languageId === 'n1ql' || window.activeTextEditor.document.languageId === 'json') ?
            window.activeTextEditor.document : undefined;

        if(doc) {
            let db = this.documentDatabase.getDatabase(doc);
            let dbPath: string;
            let dbName: string;
            if(db) {
                dbPath = db;
                dbName = basename(dbPath);
            } else {
                dbPath = "No database";
                dbName = dbPath;
            }

            this.statusBarItem.tooltip = `cblite: ${dbPath}`;
            this.statusBarItem.text = `cblite: ${dbName}`;
            
            let docID = this.documentDatabase.getDocumentID(doc);
            if(docID) {
                this.statusBarItem.tooltip += ` | ${docID}`;
                this.statusBarItem.text += ` | ${docID}`;
            }

            this.statusBarItem.show();
        } else {
            this.statusBarItem.hide();
        }
    }

    dispose() {
        this.disposable.dispose();
    }
}