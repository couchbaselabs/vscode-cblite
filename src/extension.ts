import { commands, ExtensionContext, languages, Position, TextDocument, Uri, window, workspace } from "vscode";
import { getEditorQueryDocument as getEditorDocument, pickWorkspaceDatabase, createQueryDocument, createDocContentDocument, showErrorMessage } from "./vscodewrapper";
import CbliteWorkspace from "./cbliteworkspace";
import { Configuration, getConfiguration } from "./configuration";
import { logger } from "./logging/logger";
import { Constants } from "./constants/constants";
import Explorer from "./explorer";
import Clipboard from "./utils/clipboard";
import { SqlppProvider } from "./providers/sqlpp.provider";
import { ShowMoreItem } from "./explorer/treeItem";
import { buildDocumentSchema, buildSchema, SchemaCollection, SchemaDatabase, SchemaDocument, SchemaItem, SchemaValue } from "./common";
import { Collection, Database, MutableDocument, QueryLanguage } from "./native/binding";
import { openDbAtPath } from "./utils/files";
import { pickListCollection } from "./vscodewrapper/quickPick";
var JSONstrict = require('json-bigint')({ strict: true, useNativeBigInt: true });

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
	export const lookupDocument: string = 'cblite.explorer.lookupDocument';
    export const explorerCopyRelativePath: string = 'cblite.explorer.copyRelativePath';
	export const explorerGetDocument: string = 'cblite.explorer.getDocument';
	export const explorerShowMoreItems: string = 'cblite.explorer.showMoreItems';
	export const newCollection: string = 'cblite.newCollection';
	export const deleteCollection: string = 'cblite.deleteCollection';
    export const newQuerySqlpp: string = 'cblite.newQuerySqlpp';
    export const newQueryJson: string = 'cblite.newQueryJson';
    export const quickQuery: string = 'cblite.quickQuery';
	export const createDocument: string = 'cblite.createDocument';
	export const updateDocument: string = 'cblite.updateDocument';
}

let configuration: Configuration;
let cbliteWorkspace: CbliteWorkspace;
let explorer: Explorer;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext): Promise<boolean> {
	logger.info(`Activating extension ${Constants.extensionName} v${Constants.extensionVersion}...`);

	configuration = getConfiguration();
	logger.setLogLevel(configuration.logLevel);

	context.subscriptions.push(workspace.onDidChangeConfiguration(() => {
		configuration = getConfiguration();
		logger.setLogLevel(configuration.logLevel);
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

	context.subscriptions.push(commands.registerCommand(Commands.explorerRemove, (item?: {obj: Database}) => {
		let dbPath = item?.obj;
		return explorerRemove(dbPath);
	}));

	// context.subscriptions.push(commands.registerCommand(Commands.explorerRefresh, () => {
	// 	explorerRefresh();
	// }));

	context.subscriptions.push(commands.registerCommand(Commands.explorerCopyKey, (item: SchemaItem) => {
		let path = buildPath(item);
		if(path) {
			return copyToClipboard(path);
		}

		window.showWarningMessage("No information found to copy...");
		return Promise.resolve();
	}));
	
	context.subscriptions.push(commands.registerCommand(Commands.explorerCopyValue, (item: SchemaItem) => {
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

	context.subscriptions.push(commands.registerCommand(Commands.lookupDocument, async (item: SchemaCollection) => {
		let newDocID = await window.showInputBox({prompt: "Specify the document ID"});
		if(!newDocID) {
			return;
		}

		return await getDocument(item.parent.parent.obj, item.obj, newDocID);
	}));

	context.subscriptions.push(commands.registerCommand(Commands.useDatabase, () => {
        return useDatabase();
	}));
	
	context.subscriptions.push(commands.registerCommand(Commands.newQuerySqlpp, (db?: SchemaDatabase) => {
        return newQuery(db?.obj, "select meta().id from _ limit 100");
	}));
	
	context.subscriptions.push(commands.registerCommand(Commands.newQueryJson, (db?: SchemaDatabase) => {
        return newQuery(db?.obj, '{\n\t"LIMIT":100,\n\t"WHAT": [["._id"]]\n}');
	}));

	context.subscriptions.push(commands.registerCommand(Commands.createDocument, () => {
		return saveDocument(false);
	}));

	context.subscriptions.push(commands.registerCommand(Commands.updateDocument, () => {
		return saveDocument(true);
	}));
	
	context.subscriptions.push(commands.registerCommand(Commands.explorerGetDocument, (doc: SchemaDocument) => {
		let docId = doc.id;
		return getDocument(doc.parent.parent.parent.obj, doc.parent.obj, docId);
	}));

	context.subscriptions.push(commands.registerCommand(Commands.explorerShowMoreItems, (item: ShowMoreItem) => {
		item.showMore();
	}));

	context.subscriptions.push(commands.registerCommand(Commands.newCollection, async (db: SchemaDatabase) => {
		let scope = await window.showInputBox({prompt: "Specify the scope name (blank for default)..."});
		let collection = await window.showInputBox({prompt: "Specify the collection name..."})
		if(!collection) {
			return;
		}

		try {
			let coll = db.obj.createCollection(collection, scope);
			explorer.addCollection(db, coll);
		} catch(err: any) {
			showErrorMessage(`Failed to create collection: ${err.message}`, 
				{title: "Show output", command: Commands.showOutputChannel});
		}
	}));

	context.subscriptions.push(commands.registerCommand(Commands.deleteCollection, (c: SchemaCollection) => {
		try {
			c.parent.parent.obj.deleteCollection(c.obj.name, c.obj.scopeName);
			explorer.removeCollection(c);
		} catch(err: any) {
			showErrorMessage(`Failed to delete collection: ${err.message}`, 
				{title: "Show output", command: Commands.showOutputChannel});
		}
	}));

	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
	languages.registerCompletionItemProvider("sqlpp", SqlppProvider, ...characters);


	logger.info("Extension activated.");
	return Promise.resolve(true);
}

async function useDatabase(): Promise<string | undefined> {
	let queryDocument = getEditorDocument();
	let dbPath = await pickWorkspaceDatabase(false);
	if(queryDocument && dbPath) {
		let db = await openDbAtPath(dbPath);
		if(!db) {
			return undefined;
		}
		cbliteWorkspace.bindDatabaseToDocument(db, queryDocument);
	}
}

async function getDocument(dbObj: Database, collection: Collection, docId: string): Promise<TextDocument|undefined> {
	let doc = collection.getMutableDocument(docId);

	let contentDoc = await createDocContentDocument(doc.propertiesAsJSON());
	cbliteWorkspace.bindDatabaseToDocument(dbObj, contentDoc);
	cbliteWorkspace.bindDocToDocument(doc, contentDoc);
	return contentDoc;
}

async function saveDocument(update: boolean) {
	let vscodeDoc = getEditorDocument();
	if(!vscodeDoc) {
		return;
	}

	let db = cbliteWorkspace.getDocumentDatabase(vscodeDoc);
	if(!db) {
		await useDatabase();
		db = cbliteWorkspace.getDocumentDatabase(vscodeDoc);
		if(!db) {
			return;
		}
	}

	let doc: MutableDocument;
	let collection: Collection
	if(update) {
		let tmp = cbliteWorkspace.getDocumentDoc(vscodeDoc);
		if(!tmp) {
			showErrorMessage("Cannot update this document, it has not been saved yet");
			return;
		}

		doc = tmp;
		collection = doc.collection;
	} else {
		let newDocID = await window.showInputBox({prompt: "Specify the document ID"});
		if(!newDocID) {
			return;
		}

		let collectionPick = await pickListCollection(db);
		collection = db.getCollection(collectionPick.name, collectionPick.scope);

		let tmp = new MutableDocument(newDocID);
		cbliteWorkspace.bindDocToDocument(tmp, vscodeDoc);
		doc = tmp;
	}

	doc.setPropertiesAsJSON(vscodeDoc.getText());

	try {
		collection.saveDocument(doc);
	} catch(err: any) {
		showErrorMessage(`Failed to save document: ${err.message}`, {title: "Show output", command: Commands.showOutputChannel});
		return;
	}

	explorerUpdateDocument(db, collection, doc);
	explorer.refresh();
	window.setStatusBarMessage(`Save completed!`, 2000);
}

async function explorerAdd(dbPath?: string): Promise<void> {
	if(dbPath) {
		let schema = await buildSchema(dbPath);
		if(!schema) {
			return;
		}

		explorer.add(schema);
	} else {
		try {
			dbPath = await pickWorkspaceDatabase(false);
			await explorerAdd(dbPath);
		} catch(err: any) {
			// No database selected
		}
	}
}

function explorerUpdateDocument(dbObj: Database, collection: Collection, doc: MutableDocument): void {
	let schemaCollection = explorer.getCollection(dbObj, collection);
	if(!schemaCollection) {
		return;
	}

	let schema = buildDocumentSchema(schemaCollection, doc);
	if(!schema) {
		return;
	}

	explorer.update(schemaCollection, schema);
}

function explorerRemove(dbObj?: Database): Thenable<void> {
	if(dbObj) {
		return Promise.resolve(explorer.remove(dbObj));
	}

	return Promise.resolve();
}

async function newQuery(dbObj?: Database, content: string = "", cursorPos: Position = new Position(0, 0)): Promise<TextDocument> {
	var queryDoc = await createQueryDocument(content, cursorPos, true);
	if(dbObj) {
		cbliteWorkspace.bindDatabaseToDocument(dbObj, queryDoc);
	}

	return queryDoc;
}

async function runDocumentQuery() {
	let queryDocument = getEditorDocument();
	if(queryDocument) {
		let db = cbliteWorkspace.getDocumentDatabase(queryDocument);
		if(db) {
			let query = queryDocument.getText();
			await runQuery(db, query, true);
		} else {
			await useDatabase();
			await runDocumentQuery();
		}
	}
}


async function runQuery(dbObj: Database, query: string, display: boolean) {
	let language = window.activeTextEditor?.document.languageId !== "json" 
		? QueryLanguage.SQLPP
		: QueryLanguage.JSON;

	let queryObj = dbObj.createQuery(language, query);
	let results = queryObj.execute();

	if(!results) {
		return;
	}

	if(display) {
		var doc = await workspace.openTextDocument({content: JSONstrict.stringify(results), language: "json"});
		await window.showTextDocument(doc, {preview: false});
	}
}

async function copyToClipboard(text: string) {
	await Clipboard.copy(text);
	window.setStatusBarMessage(`Copied '${text}' to clipboard.`, 2000);
}

function buildPath(item: SchemaItem): string {
	var current: SchemaItem|undefined = item;
	let components: string[] = [];
	while(current) {
		if('id' in current) {
			components.unshift(current.id);
		} else if('name' in current) {
			components.unshift(`["${current.name}"]`);
		}

		if('parent' in current) {
			if('array' in current.parent) {
				components.unshift(`[${current.parent.array!.indexOf(current as SchemaValue)}]`);
			}

			current = current.parent;
		} else {
			current = undefined;
		}
	}

	return components.join("");
}
