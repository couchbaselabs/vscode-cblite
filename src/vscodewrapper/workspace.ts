import { Position, Selection, TextDocument, ViewColumn, workspace } from "vscode";
import { window } from 'vscode';

export function getEditorQueryDocument(): TextDocument|undefined {
    let editor = window.activeTextEditor;
    if(editor) {
        return editor.document.languageId === 'n1ql' || editor.document.languageId === 'json' ? editor.document : undefined;
    }

    return undefined;
}

export function createQueryDocument(content: string, cursorPos: Position, show?: boolean): Thenable<TextDocument> {
    let json: boolean = !content.startsWith("select");
    return workspace.openTextDocument({language: json ? 'json' : 'n1ql', content: content}).then(doc => {
        if(show) {
            window.showTextDocument(doc, ViewColumn.One).then(editor => {
                editor.selection = new Selection(cursorPos, cursorPos);
            });
        }

        return Promise.resolve(doc);
    });
}