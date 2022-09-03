#pragma once

#include "cblite.hh"
#include "CouchbaseWrapper.hh"

class DatabaseConfiguration;

class Database : public CouchbaseWrapper<Database, cbl::Database> {
public:
    CBL_CLASS_BOILERPLATE(Database);

    static Napi::Value exists(const Napi::CallbackInfo& info);
    static void copyDatabase(const Napi::CallbackInfo& info);
    static void deleteDatabase(const Napi::CallbackInfo& info);

    Napi::Value get_name(const Napi::CallbackInfo&);
    Napi::Value get_path(const Napi::CallbackInfo&);
    Napi::Value get_config(const Napi::CallbackInfo&);

    Napi::Value getScopeNames(const Napi::CallbackInfo&);
    Napi::Value getCollectionNames(const Napi::CallbackInfo&);
    Napi::Value getCollection(const Napi::CallbackInfo&);
    Napi::Value createCollection(const Napi::CallbackInfo&);
    void deleteCollection(const Napi::CallbackInfo&);
    Napi::Value getDefaultCollection(const Napi::CallbackInfo&);

    void close(const Napi::CallbackInfo&);
    void deleteDb(const Napi::CallbackInfo&);
   
    Napi::Value createQuery(const Napi::CallbackInfo&);

private:
    DatabaseConfiguration* _config;
};