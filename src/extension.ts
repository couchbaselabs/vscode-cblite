import { commands, ExtensionContext, languages, Position, TextDocument, Uri, window, workspace } from "vscode";
import { getEditorQueryDocument, pickWorkspaceDatabase, pickListDatabase, showErrorMessage, createQueryDocument } from "./vscodewrapper";
import CbliteWorkspace from "./cbliteworkspace";
import { executeQuery, schema } from "./cblite/cblite";
import { Configuration, getConfiguration } from "./configuration";
import { logger } from "./logging/logger";
import { Constants } from "./constants/constants";
import { validateCbliteCommand } from "./cblite/cbliteCommandValidation";
import Explorer from "./explorer";
import Clipboard from "./utils/clipboard";
import { Schema } from "./common";
import { N1QLProvider } from "./providers/n1ql.provider"

export namespace Commands {
	export const showOutputChannel: string = "cblite.showOutputChannel";
	export const runDocumentQuery: string = "cblite.runDocumentQuery";
	//export const runSelectedQuery: string = "cblite.runSelectedQuery";
	export const useDatabase: string = 'cblite.useDatabase';
	export const explorerAdd: string = 'cblite.explorer.add';
	export const explorerRemove: string = 'cblite.explorer.remove';
	// export const explorerRefresh: string = 'cblite.explorer.refresh';
	export const explorerCopyKey: string = 'cblite.explorer.copyKey';
	export const explorerCopyValue: string = 'cblite.explorer.copyValue';
    export const explorerCopyPath: string = 'cblite.explorer.copyPath';
    export const explorerCopyRelativePath: string = 'cblite.explorer.copyRelativePath';
    export const newQueryN1ql: string = 'cblite.newQueryN1ql';
    export const newQueryJson: string = 'cblite.newQueryJson';
    export const quickQuery: string = 'cblite.quickQuery';
}

let cbliteCommand: string;
let configuration: Configuration;
let cbliteWorkspace: CbliteWorkspace;
let explorer: Explorer;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext): Promise<boolean> {
	logger.info(`Activating extension ${Constants.extensionName} v${Constants.extensionVersion}...`);

	configuration = getConfiguration();
	logger.setLogLevel(configuration.logLevel);
	setCbliteCommand(configuration.cblite, context.extensionPath);

	context.subscriptions.push(workspace.onDidChangeConfiguration(() => {
		configuration = getConfiguration();
		logger.setLogLevel(configuration.logLevel);
		setCbliteCommand(configuration.cblite, context.extensionPath);
	}));

	cbliteWorkspace = new CbliteWorkspace();
	explorer = new Explorer(context);

	context.subscriptions.push(commands.registerCommand(Commands.showOutputChannel, () => {
		logger.showOutput();
	}));

	context.subscriptions.push(commands.registerCommand(Commands.runDocumentQuery, async () => {
		await runDocumentQuery();
	}));

	context.subscriptions.push(commands.registerCommand(Commands.explorerAdd, (dbUri?: Uri) => {
		let dbPath = dbUri? dbUri.fsPath : undefined;
        return explorerAdd(dbPath);
	}));

	context.subscriptions.push(commands.registerCommand(Commands.explorerRemove, (item?: {path: string}) => {
		let dbPath = item?.path;
		return explorerRemove(dbPath);
	}));

	// context.subscriptions.push(commands.registerCommand(Commands.explorerRefresh, () => {
	// 	explorerRefresh();
	// }));

	context.subscriptions.push(commands.registerCommand(Commands.explorerCopyKey, (item: Schema.Item) => {
		let path = buildPath(item);
		if(path) {
			return copyToClipboard(path);
		}

		window.showWarningMessage("No information found to copy...");
		return Promise.resolve();
	}));
	
	context.subscriptions.push(commands.registerCommand(Commands.explorerCopyValue, (item: Schema.Item) => {
		if('value' in item) {
			return copyToClipboard(item.value.toString());
		}

		window.showWarningMessage("No information found to copy...");
		return Promise.resolve();
	}));
	
	context.subscriptions.push(commands.registerCommand(Commands.explorerCopyPath, (item: {path: string}) => {
        let path = item.path;
        return copyToClipboard(path);
	}));
	
	context.subscriptions.push(commands.registerCommand(Commands.explorerCopyRelativePath, (item: {path: string}) => {
        let path = workspace.asRelativePath(item.path);
        return copyToClipboard(path);
    }));

	context.subscriptions.push(commands.registerCommand(Commands.useDatabase, () => {
        return useDatabase();
	}));
	
	context.subscriptions.push(commands.registerCommand(Commands.newQueryN1ql, (db?: Uri|Schema.Database) => {
        let dbPath: string | undefined;
		if(db instanceof Uri) {
			dbPath = db.fsPath;
		} else {
			dbPath = db?.path;
		}

        return newQuery(dbPath, "select _id limit 100");
	}));
	
	context.subscriptions.push(commands.registerCommand(Commands.newQueryJson, (db?: Uri|Schema.Database) => {
		let dbPath: string | undefined;
		if(db instanceof Uri) {
			dbPath = db.fsPath;
		} else {
			dbPath = db?.path;
		}

        return newQuery(dbPath, '{\n\t"LIMIT":100,\n\t"WHAT": [["._id"]]\n}');
	}));

	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
	languages.registerCompletionItemProvider("n1ql", N1QLProvider, ...characters);


	logger.info("Extension activated.");
	return Promise.resolve(true);
}

function useDatabase(): Thenable<string> {
	let queryDocument = getEditorQueryDocument();
	return pickWorkspaceDatabase(false).then(dbPath => {
		if(queryDocument && dbPath) {
			cbliteWorkspace.bindDatabaseToDocument(dbPath, queryDocument);
		}

		return Promise.resolve(dbPath);
	});
}

function explorerAdd(dbPath?: string): Thenable<void> {
	if(dbPath) {
		return schema(cbliteCommand, dbPath).then(schema => {
			return explorer.add(schema);
		}, err =>  {
			let message = `Failed to open database: ${err.message}`;
			showErrorMessage(message, {title: "Show output", command: Commands.showOutputChannel});
		});
	} else {
		return pickWorkspaceDatabase(false).then(dbPath => {
			if(dbPath) {
				return explorerAdd(dbPath);
			}
		}, err => {
			// No database selected
		});
	}
}

function explorerRemove(dbPath?: string): Thenable<void> {
	if(dbPath) {
		return Promise.resolve(explorer.remove(dbPath));
	}

	let dbList = explorer.list().map(db => db.path);
	return pickListDatabase(false, dbList).then(
		dbPath => {
			if(dbPath) {
				explorer.remove(dbPath);
			}
		},
		onrejected => {
			// fail silently
		}
	)
}

async function newQuery(dbPath?: string, content: string = "", cursorPos: Position = new Position(0, 0)): Promise<TextDocument> {
	var queryDoc = await createQueryDocument(content, cursorPos, true);
	if(dbPath) {
		cbliteWorkspace.bindDatabaseToDocument(dbPath, queryDoc);
	}

	return queryDoc;
}

async function runDocumentQuery() {
	let queryDocument = getEditorQueryDocument();
	if(queryDocument) {
		let dbPath = cbliteWorkspace.getDocumentDatabase(queryDocument);
		if(dbPath) {
			let query = queryDocument.getText();
			await runQuery(dbPath, query, true);
		} else {
			await useDatabase();
			await runDocumentQuery();
		}
	}
}


async function runQuery(dbPath: string, query: string, display: boolean) {
	let results = await executeQuery(cbliteCommand, dbPath, query, window.activeTextEditor?.document.languageId !== "json").then(({results, error}) => {
		if(error) {
			logger.error(`\n${error.message}`);
			showErrorMessage(error.message, {title: "Show Output", command: Commands.showOutputChannel});
			return undefined;
		}

		return results;
	});

	if(!results) {
		return;
	}

	if(display) {
		var doc = await workspace.openTextDocument({content: results, language: "json"});
		await window.showTextDocument(doc, {preview: false});
	}
}

function setCbliteCommand(command: string, extensionPath: string) {
	try {
		cbliteCommand = validateCbliteCommand(command, extensionPath);
	} catch(e) {
		logger.error(e.message);
		showErrorMessage(e.message, {title: "Show output", command: Commands.showOutputChannel});
		cbliteCommand = "";
	}
}

async function copyToClipboard(text: string) {
	await Clipboard.copy(text);
	window.setStatusBarMessage(`Copied '${text}' to clipboard.`, 2000);
}

function buildPath(item: Schema.Item): string {
	var current: Schema.Item|undefined = item;
	let components: string[] = [];
	while(current) {
		if('id' in current) {
			components.unshift(current.id);
		} else if('name' in current) {
			components.unshift(`["${current.name}"]`)
		}

		if('parent' in current) {
			if('array' in current.parent) {
				components.unshift(`[${current.parent.array!.indexOf(current as Schema.Value)}]`);
			}

			current = current.parent;
		} else {
			current = undefined;
		}
	}

	return components.join("");
}