let addon: any;
const os = require("os");
let l: any;
try {
    l = require("../logging/logger");
} catch(e) {
    console.log("VSCode logging unavailable");
}

function print_load_error(e: any) {
    if(l) {
        l.logger.error("Failed to load...");
        l.logger.error(e);
    } else {
        console.log("Failed to load...");
        console.log(e);
    }
}

function print_msg(msg: string) {
    if(l) {
        l.logger.info(msg);
    } else {
        console.log(msg);
    }
}

if(os.platform() === "win32") {
    print_msg("Loading Windows NAPI addon...");
    try {
        addon = require("../../out/Windows/cblite-js.node");
    } catch(e) {
        print_load_error(e);
        throw e;
    }
} else if(os.platform() === "darwin") {
    print_msg("Loading macOS NAPI addon...");
    try {
        addon = require("../../out/Darwin/cblite-js.node");
    } catch(e) {
        print_load_error(e);
        throw e;
    }
} else {
    print_msg("Loading Linux NAPI addon...");
    try {
        addon = require("../../out/Linux/cblite-js.node");
    } catch(e) {
        print_load_error(e);
        throw e;
    }
}

export enum CBLErrorDomain {
    LITE_CORE = 1,
    POSIX,
    SQLITE,
    FLEECE,
    NETWORK,
    WEB_SOCKET
}

export enum LiteCoreErrorCode {
    ASSERTION_FAILED = 1,
    UNIMPLEMENTED,
    UNSUPPORTED_ENCRYPTION,
    BAD_REVISION_ID,
    CORRUPT_REVISION_DATA,
    NOT_OPEN,
    NOT_FOUND,
    CONFLICT,
    INVALID_PARAMETER,
    UNEXPECTED_ERROR,
    CANT_OPEN_FILE,
    IO_ERROR,
    MEMORY_ERROR,
    NOT_WRITEABLE,
    CORRUPT_DATA,
    BUSY,
    NOT_IN_TRANSACTION,
    TRANSACTION_NOT_CLOSED,
    UNSUPPORTED,
    NOT_A_DATABASE_FILE,
    WRONG_FORMAT,
    CRYPTO,
    INVALID_QUERY,
    MISSING_INDEX,
    INVALID_QUERY_PARAM,
    REMOTE_ERROR,
    DATABASE_TOO_OLD,
    DATABASE_TOO_NEW,
    BAD_DOC_ID,
    CANT_UPGRADE_DATABASE
}

export enum EncryptionAlgorithm {
    NONE,
    AES256
}

export interface EncryptionKey {
    algorithm: EncryptionAlgorithm
    bytes: ArrayBuffer | Uint8Array
}

export class EncryptionKeyMethods {
    public static createFromPassword(password: string) : EncryptionKey {
        return addon.EncryptionKey.createFromPassword(password);
    }

    public static createFromPasswordOld(password: string) : EncryptionKey | undefined {
        if(addon.EncryptionKey.createFromPasswordOld === null) {
            return undefined;
        }

        return addon.EncryptionKey.createFromPasswordOld(password);
    }
}

export var EncryptionKey: {
    new(): EncryptionKey
    new(algo: EncryptionAlgorithm, bytes: ArrayBuffer | Uint8Array): EncryptionKey
} = addon.EncryptionKey;

export interface DatabaseConfiguration {
    directory: string
    encryptionKey: EncryptionKey
}

export var DatabaseConfiguration: {
    new(): DatabaseConfiguration
} = addon.DatabaseConfiguration;

export class Database {
    private _inner: any;

    public static exists(name: string, inDirectory: string): boolean {
        return addon.Database.exists(name, inDirectory);
    }

    public static copyDatabase(fromPath: string, toName: string,
        config?: DatabaseConfiguration): void {
        if(config) {
            addon.Database.copyDatabase(fromPath, toName, config);
        } else {
            addon.Database.copyDatabase(fromPath, toName);
        }
    }

    public static deleteDatabase(name: string, inDirectory: string): void {
        addon.Database.deleteDatabase(name, inDirectory);
    }

    public get name(): string {
        return this._inner.name;
    }

    public get path(): string {
        return this._inner.path;
    }
    
    public get config(): DatabaseConfiguration {
        return this._inner.config;
    }

    public constructor(name: string, config?: DatabaseConfiguration) {
        if(!config) {
            this._inner = new addon.Database(name);
        } else {
            this._inner = new addon.Database(name, config);
        }
    }

    public getScopeNames(): Array<string> {
        return this._inner.getScopeNames();
    }

    public getCollectionNames(scope?: string): Array<string> {
        return scope
            ? this._inner.getCollectionNames(scope)
            : this._inner.getCollectionNames();
    }

    public getCollection(name: string, scope?: string): Collection {
        return scope
            ? this._inner.getCollection(name, scope)
            : this._inner.getCollection(name);
    }

    public createCollection(name: string, scope?: string): Collection {
        return scope
            ? this._inner.createCollection(name, scope)
            : this._inner.createCollection(name);
    }

    public deleteCollection(name: string, scope?: string): void {
        if(scope) {
            this._inner.deleteCollection(name, scope);
        } else {
            this._inner.deleteCollection(name);
        }
    }

    public getDefaultCollection(): Collection {
        return this._inner.getDefaultCollection();
    }

    public close(): void { 
        this._inner.close();
    }

    public deleteDatabase(): void {
        this._inner.deleteDatabase();
    }
    
    public createQuery(language: QueryLanguage, expressions: string): Query {
        return this._inner.createQuery(language, expressions);
    }
}

export interface Document {
    id: string
    revisionID: string
    sequence: bigint
    collection: Collection
    propertiesAsJSON(): string
}

export interface MutableDocument extends Document {
    setPropertiesAsJSON(properties: string): void
}

export var MutableDocument: {
    new(): MutableDocument
    new(id: string): MutableDocument
} = addon.MutableDocument;

export enum QueryLanguage {
    JSON,
    SQLPP
}

export interface ValueIndexConfiguration {
    expressionLanguage: QueryLanguage
    expressions: string
}

export var ValueIndexConfiguration: {
    new(): ValueIndexConfiguration
} = addon.ValueIndexConfiguration;

export interface FullTextIndexConfiguration {
    expressionLanguage: QueryLanguage
    expressions: string
    ignoreAccents: boolean
    language: string
}

export var FullTextIndexConfiguration: {
    new(): FullTextIndexConfiguration
} = addon.FullTextIndexConfiguration;

export interface Query {
    columnNames(): Array<string>
    explain(): string
    execute(): Array<Record<string, any>>
}

export class BlobMethods {
    public static isBlob(dict: Record<string, any>): boolean {
        return addon.Blob.isBlob(dict);
    }
}

export interface Blob {
    length: bigint
    contentType: string
    digest: string
}

export var Blob: {
    new(contentType: string, content: ArrayBuffer | Uint8Array): Blob
} = addon.Blob;

export interface Collection {
    name: string
    scopeName: string
    count: bigint
    getDocument(id: string) : Document
    getMutableDocument(id: string) : MutableDocument
    saveDocument(doc: MutableDocument) : void
    deleteDocument(doc: Document) : void
    createValueIndex(name: string, config: ValueIndexConfiguration) : void
    createFullTextIndex(name: string, config: FullTextIndexConfiguration) : void
    deleteIndex(name: string) : void
    getIndexNames() : Array<string>
}
