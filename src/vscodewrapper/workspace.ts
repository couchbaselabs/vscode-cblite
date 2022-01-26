import { Position, Selection, TextDocument, ViewColumn, workspace } from "vscode";
import { window } from 'vscode';

export function getEditorQueryDocument(): TextDocument|undefined {
    let editor = window.activeTextEditor;
    if(editor) {
        return editor.document.languageId === 'sqlpp' || editor.document.languageId === 'json' ? editor.document : undefined;
    }

    return undefined;
}

export function createQueryDocument(content: string, cursorPos: Position, show?: boolean): Thenable<TextDocument> {
    let json: boolean = !content.startsWith("select");
    return workspace.openTextDocument({language: json ? 'json' : 'sqlpp', content: content}).then(doc => {
        if(show) {
            window.showTextDocument(doc, ViewColumn.One).then(editor => {
                editor.selection = new Selection(cursorPos, cursorPos);
            });
        }

        return Promise.resolve(doc);
    });
}

export function createDocContentDocument(json: string): Thenable<TextDocument> {
    return workspace.openTextDocument({language: "json", content: json}).then(doc => {
        window.showTextDocument(doc, ViewColumn.One);
        return Promise.resolve(doc);
    });
}