import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { arch, platform } from "os";
import { join } from "path";
import { window } from "vscode";
import { logger } from "../logging/logger";

export function validateCbliteCommand(cbliteCommand: string, extensionPath: string): string {
    let isValid = isCbliteCommandValid(cbliteCommand);
    if(isValid) {
        return cbliteCommand;
    }

    cbliteCommand = getCbliteBinariesPath(extensionPath);
    if(!cbliteCommand) {
        throw new Error("Unable to find a valid cblite command.  Fallback binary not found.")
    }

    isValid = isCbliteCommandValid(cbliteCommand);
    if(isValid) {
        return cbliteCommand;
    }

    throw new Error("Unable to find a valid cblite command. Fallback binary is not valid.");
}

export function isCbliteCommandValid(cbliteCommand: string): boolean {
    let proc = spawnSync(`"${cbliteCommand}"`, ["--version"], {shell: true});
    let output = proc.stdout.toString();

    if(proc.status !== 0) {
        return false;
    }

    let match = output.match(/Couchbase Lite Core \d\.\d\.\d(-EE)? \(\S+\)/);
    if(!match) {
        logger.debug(`${cbliteCommand} resulted in unknown version output`);
    }

    return match ? true : false;
}

export function getCbliteBinariesPath(extensionPath: string): string {
    let plat = platform();
    let os_arch = arch();
    let cbliteBin: string;

    if(os_arch != "x64") {
        window.showErrorMessage("Sorry, only x64 is supported!");
        return "";
    }

    switch(plat) {
        case 'win32':
            cbliteBin = "cblite.exe";
            break;
        case 'linux':
            cbliteBin = "cblite-linux";
            break;
        case 'darwin':
            cbliteBin = "cblite-macos";
            break;
        default:
            logger.info("Fallback binary not found: system OS not recognized");
            cbliteBin = "";
            break;
    }

    if(cbliteBin) {
        let path = join(extensionPath, "bin", cbliteBin);
        if(existsSync(path)) {
            logger.debug(`Fallback cblite binary found: '${path}'`);
            return path;
        } 

        logger.warn(`Fallback cblite binary not found: '${path}`);

    }

    return "";
}