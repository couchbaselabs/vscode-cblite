"use strict";

const assert = require("assert");
const { EncryptionAlgorithm, EncryptionKey, DatabaseConfiguration, Database, MutableDocument, Blob, ValueIndexConfiguration, QueryLanguage } = require("../out/native/binding.js");

function testBasic()
{
    const instance = new DatabaseConfiguration();
    assert.strictEqual(instance.directory, undefined);
    instance.directory = "/tmp";
    assert.strictEqual(instance.directory, "/tmp", "Unexpected value returned");
}

function testEncryptionKey()
{
    const instance = new DatabaseConfiguration();
    assert.strictEqual(instance.encryptionKey, undefined);
    var key = new EncryptionKey();
    assert.strictEqual(key.algorithm, EncryptionAlgorithm.NONE);

    const bytes = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
        24, 25, 26, 27, 28, 29, 30, 31]);
    key = new EncryptionKey(EncryptionAlgorithm.AES256, bytes);
    assert.strictEqual(key.algorithm, EncryptionAlgorithm.AES256);
    assert.strictEqual(key.bytes.byteLength, 32);
    const bytes2 = key.bytes;
    assert.deepStrictEqual(bytes.buffer, bytes2);

    instance.encryptionKey = key;
    assert.strictEqual(instance.encryptionKey, key);
}

assert.doesNotThrow(testBasic, undefined, "testBasic threw an expection");
assert.doesNotThrow(testEncryptionKey, undefined, "testEncryptionKey threw an exception");

assert.strictEqual(Database.exists("invalid", "/tmp"), false);
const dbConfig = new DatabaseConfiguration();
dbConfig.directory = "/tmp";
const db = new Database("test", dbConfig);
console.log(db.name, db.path);

const doc = new MutableDocument("test-doc");
console.log(doc.id);

doc.cool = true;
doc.answer = 42n;
doc.name = "Jim";
doc.array = [1, 2, 3];
doc.blob = new Blob("application/octet-stream", new Uint8Array([0, 1, 2, 3, 4, 5]));
console.log(doc);

try {
    db.getDefaultCollection().saveDocument(doc);
} catch(err) {
    console.log(err);
}

const gotDoc = db.getDefaultCollection().getDocument(doc.id);
console.log(gotDoc.id, gotDoc.revisionID, gotDoc, gotDoc.blob.digest);

// var query = db.createQuery(QueryLanguage.SQLPP, "SELECT * FROM _");
// console.log(query.columnNames());
// console.log(query.execute());

// db.deleteDocument(doc);

// console.log("Indexes:", db.getIndexNames());
// var config = new ValueIndexConfiguration();
// config.expressionLanguage = QueryLanguage.SQLPP;
// config.expressions = "name";
// db.createValueIndex("tmp", config);
// console.log("Indexes:", db.getIndexNames());
// db.deleteIndex("tmp");

console.log("Tests passed- everything looks OK!");