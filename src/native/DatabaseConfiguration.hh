#pragma once

#include "cblite.hh"
#include "CouchbaseWrapper.hh"

class EncryptionKey
#ifdef COUCHBASE_ENTERPRISE
: public CouchbaseWrapper<EncryptionKey, CBLEncryptionKey> {
#else
: public Napi::ObjectWrap<EncryptionKey> {
#endif
public:
    CBL_CLASS_BOILERPLATE(EncryptionKey);

    CBL_GETSET(algorithm);
    CBL_GETSET(bytes);

    static Napi::Value createFromPassword(const Napi::CallbackInfo&);
    static Napi::Value createFromPasswordOld(const Napi::CallbackInfo&);
private:
    size_t setBytes(Napi::Env& env, Napi::Value val);
};

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