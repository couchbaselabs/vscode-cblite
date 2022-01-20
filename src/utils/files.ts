import { lstatSync } from "fs";
import { basename, dirname } from "path";
import { window } from "vscode";
import { Commands } from "../extension";
import { CBLErrorDomain, Database, DatabaseConfiguration, EncryptionKeyMethods, LiteCoreErrorCode } from "../native/binding";
import { showErrorMessage } from "../vscodewrapper";

export async function openDbAtPath(filePath: string, password?: string): Promise<Database | undefined> {
    if(!isDirectorySync(filePath)) {
        let err: any;
        err.domain = CBLErrorDomain.LITE_CORE;
        err.code = LiteCoreErrorCode.NOT_A_DATABASE_FILE;
        err.message = `'${filePath}' is not a cblite2 folder.`;
        throw err;
    }

    let filename = basename(filePath);
    filename = filename.substring(0, filename.lastIndexOf(".")) || filename;
    let config = new DatabaseConfiguration();
    config.directory = dirname(filePath);
    if(password) {
        config.encryptionKey = EncryptionKeyMethods.createFromPassword(password);
    }

    try {
        return new Database(filename, config);
    } catch(err: any) {
        let message = `Failed to open database: ${err.message}`;
        if(err.domain === CBLErrorDomain.LITE_CORE && 
            err.code === LiteCoreErrorCode.NOT_A_DATABASE_FILE &&
            !password) {
            password = await window.showInputBox({prompt: "Please enter the DB password", password: true});
            if(!password) {
                showErrorMessage(message, {title: "Show output", command: Commands.showOutputChannel});
            } else {
                return await openDbAtPath(filePath, password);
            }
        } else {
            showErrorMessage(message, {title: "Show output", command: Commands.showOutputChannel});
        }
    }

    return undefined;
}

export function isDirectorySync(filePath: string): boolean {
    try {
        var stat = lstatSync(filePath);
        return stat.isDirectory();
    } catch(e) {
        // lstatSync throws an error if path doesn't exist
        return false;
    }
}