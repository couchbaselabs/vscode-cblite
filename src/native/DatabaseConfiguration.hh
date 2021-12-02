#pragma once

#include "cblite.hh"
#include "cbl++/Database.hh"
#include "CouchbaseWrapper.hh"

#ifdef COUCHBASE_ENTERPRISE
class EncryptionKey : public CouchbaseWrapper<EncryptionKey, CBLEncryptionKey> {
public:
    CBL_CLASS_BOILERPLATE(EncryptionKey);

    CBL_GETSET(algorithm);
    CBL_GETSET(bytes);
private:
    size_t setBytes(Napi::Env& env, Napi::Value val);
};
#endif

class DatabaseConfiguration : public CouchbaseWrapper<DatabaseConfiguration, CBLDatabaseConfiguration> {
public:
    CBL_CLASS_BOILERPLATE(DatabaseConfiguration);

    CBL_GETSET(directory);
    CBL_GETSET(encryptionKey);
private:
    std::string _directory;

#ifdef COUCHBASE_ENTERPRISE
    EncryptionKey* _encryptionKey {nullptr};
#endif
};