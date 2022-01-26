import { DocumentDatabaseBindings } from "./documentDatabaseBindings";
import { StatusBarItem, window, StatusBarAlignment, Disposable, workspace } from "vscode";

export class DatabaseStatusBarItem implements Disposable {
    private _disposable: Disposable;
    private _statusBarItem: StatusBarItem;

    constructor(private documentDatabase: DocumentDatabaseBindings) {
        let subscriptions: Disposable[] = [];

        this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 100);
        this._statusBarItem.command = "cblite.useDatabase";
        subscriptions.push(this._statusBarItem);

        subscriptions.push(window.onDidChangeActiveTextEditor(e => this.update()));
        subscriptions.push(window.onDidChangeTextEditorViewColumn(e => this.update()));
        subscriptions.push(workspace.onDidOpenTextDocument(e => this.update()));
        subscriptions.push(workspace.onDidCloseTextDocument(e => this.update()));

        this._disposable = Disposable.from(...subscriptions);
    }

    update() {
        let doc = window.activeTextEditor && 
            (window.activeTextEditor.document.languageId === 'sqlpp' || window.activeTextEditor.document.languageId === 'json') ?
            window.activeTextEditor.document : undefined;

        if(doc) {
            let db = this.documentDatabase.getDatabase(doc);
            let dbPath: string;
            let dbName: string;
            if(db) {
                dbPath = db.path;
                dbName = db.name;
            } else {
                dbPath = "No database";
                dbName = dbPath;
            }

            this._statusBarItem.tooltip = `cblite: ${dbPath}`;
            this._statusBarItem.text = `cblite: ${dbName}`;
            
            let cblDoc = this.documentDatabase.getDocument(doc);
            if(cblDoc) {
                this._statusBarItem.tooltip += ` | ${cblDoc.id}`;
                this._statusBarItem.text += ` | ${cblDoc.id}`;
            }

            this._statusBarItem.show();
        } else {
            this._statusBarItem.hide();
        }
    }

    dispose() {
        this._disposable.dispose();
    }
}