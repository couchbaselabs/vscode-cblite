#pragma once

#include "cbl++/Database.hh"
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
    Napi::Value get_count(const Napi::CallbackInfo&);
    Napi::Value get_config(const Napi::CallbackInfo&);

    void close(const Napi::CallbackInfo&);
    void deleteDb(const Napi::CallbackInfo&);
    Napi::Value getDocument(const Napi::CallbackInfo&);
    Napi::Value getMutableDocument(const Napi::CallbackInfo&);
    void saveDocument(const Napi::CallbackInfo&);
    void deleteDocument(const Napi::CallbackInfo&);

    void createValueIndex(const Napi::CallbackInfo&);
    void createFullTextIndex(const Napi::CallbackInfo&);
    void deleteIndex(const Napi::CallbackInfo&);
    Napi::Value getIndexNames(const Napi::CallbackInfo&);
    Napi::Value createQuery(const Napi::CallbackInfo&);

private:
    DatabaseConfiguration* _config;
};