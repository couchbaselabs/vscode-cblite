import { lstatSync } from "fs";

export function isDirectorySync(filePath: string): boolean {
    try {
        var stat = lstatSync(filePath);
        return stat.isDirectory();
    } catch(e) {
        // lstatSync throws an error if path doesn't exist
        return false;
    }
}