import * as child_process from "child_process";
import { Schema } from "../common";

export interface QueryResult {
    results?: string;
    error?: Error;
}

export function executeQuery(cbliteCommand: string, dbPath: string, query: string, n1ql: boolean): Promise<QueryResult> {
    let subCommand = n1ql ? "select" : "query";
    return executeCommand(cbliteCommand, [subCommand, "--raw", dbPath, query.replace("select ", "")]);
}

export function executeCommand(cbliteCommand: string, cliArgs: string[]): Promise<QueryResult> {
    if(!cbliteCommand) {
        return Promise.reject("Invalid cblite command, please set the value of the cblite.cblite setting");
    }

    let results = "";
    let errorMessage = "";

    let proc = child_process.spawn(cbliteCommand, cliArgs, {stdio: ['pipe', "pipe", "pipe" ]});
    proc.stdout.on('data', (data) => results += data.toString().trim());
    proc.stderr.on('data', (data) => errorMessage += data.toString().trim());
    proc.once('error', (data) => errorMessage += data);

    return new Promise<QueryResult>((resolve) => {
        proc.once('close', () => {
            let error = errorMessage ? Error(errorMessage) : undefined;
            resolve({results: results, error: error});
        });
    });   
}

export function schema(cbliteCommand: string, dbPath: string): Promise<Schema.Database> {
    if(!cbliteCommand) {
        return Promise.reject("Invalid cblite command, please set the value of the cblite.cblite setting");
    }

    return Promise.resolve(Schema.build(dbPath, cbliteCommand));
}