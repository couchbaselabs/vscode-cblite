import { workspace } from "vscode";
import { Level } from "../logging/logger";

const properties = require('../../package.json').contributes.configuration.properties;

export interface Configuration {
    cblite: string;
    logLevel: string;
}

export function getConfiguration() {
    return {
        cblite: _cblite(),
        logLevel: _logLevel()
    } as Configuration;
}

function _cblite() : string {
    let cbliteConf = workspace.getConfiguration().get<string>('cblite.cblite');
    let cblite = cbliteConf ? cbliteConf.toString() : '';
    return cblite;
}

function _logLevel() : string {
    let logLevelConf = workspace.getConfiguration().get<string>('cblite.logLevel');
    let logLevel : string = properties["cblite.logLevel"]["default"];
    if(logLevelConf && (<any>Level)[`${logLevelConf}`] !== null) {
        logLevel = logLevelConf.toString();
    }

    return logLevel;
}