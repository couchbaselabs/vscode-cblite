import { spawnSync } from "child_process";
import { logger } from "../logging/logger";

export function validateCbliteCommand(cbliteCommand: string): string {
    let isValid = isCbliteCommandValid(cbliteCommand);
    if(isValid) {
        return cbliteCommand;
    }

    throw new Error("Invalid cblite command, please set the value of the cblite.cblite setting");
}

export function isCbliteCommandValid(cbliteCommand: string): boolean {
    let proc = spawnSync(`"${cbliteCommand}"`, ["--version"], {shell: true});
    let output = proc.stdout.toString();

    if(proc.status !== 0) {
        return false;
    }

    let match = output.match(/Couchbase Lite Core \d\.\d\.\d \(\S+\)/);
    if(!match) {
        logger.debug(`${cbliteCommand} resulted in unknown version output`);
    }

    return match ? true : false;
}