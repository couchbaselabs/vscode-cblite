#include "Database.hh"
#include "Collection.hh"
#include "DatabaseConfiguration.hh"
#include "Document.hh"
#include "Query.hh"

#include <iostream>

Database::Database(const Napi::CallbackInfo& info)
    :CouchbaseWrapper(info)
{
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, info.Length() == 1 || info.Length() == 2,
         CBL_ARGC_ERR_MSG(1 or 2));

    CBL_TYPE_ASSERT(env, info[0].IsString(), CBL_ARGTYPE_ERR_MSG(0, string));
    std::string name = info[0].As<Napi::String>();

   try {
        if(info.Length() == 2) {
            CBL_TYPE_ASSERT(env, info[1].IsObject(), CBL_ARGTYPE_ERR_MSG(1, object));
            auto* config = ObjectWrap<DatabaseConfiguration>::Unwrap(info[1].As<Napi::Object>());
            _config = config;
            _inner = cbl::Database(name, *config);
        } else {
            _inner = cbl::Database(name);
        }
    } CATCH_AND_ASSIGN_VOID(env)
}

Napi::Value Database::exists(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 2, CBL_ARGC_ERR_MSG(2));
    CBL_TYPE_ASSERT_RET(env, info[0].IsString(), CBL_ARGTYPE_ERR_MSG(0, string));
    CBL_TYPE_ASSERT_RET(env, info[1].IsString(), CBL_ARGTYPE_ERR_MSG(1, string));

    std::string name = info[0].As<Napi::String>();
    std::string inDir = info[1].As<Napi::String>();
    return Napi::Boolean::New(env, cbl::Database::exists(name, inDir));
}

void Database::copyDatabase(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, info.Length() == 2 || info.Length() == 3,
        CBL_ARGC_ERR_MSG(2 or 3));

    CBL_TYPE_ASSERT(env, info[0].IsString(), CBL_ARGTYPE_ERR_MSG(0, string));
    CBL_TYPE_ASSERT(env, info[1].IsString(), CBL_ARGTYPE_ERR_MSG(1, string));
    std::string from = info[0].As<Napi::String>();
    std::string to = info[1].As<Napi::String>();
    try {
        if(info.Length() == 3) {
            CBL_TYPE_ASSERT(env, info[2].IsObject(), CBL_ARGTYPE_ERR_MSG(2, object));
            auto* config = Napi::ObjectWrap<DatabaseConfiguration>::Unwrap(info[2].As<Napi::Object>());
            cbl::Database::copyDatabase(from, to, *config);
        } else {
            cbl::Database::copyDatabase(from, to);
        }
    } CATCH_AND_ASSIGN_VOID(env)
}

void Database::deleteDatabase(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, info.Length() == 2, CBL_ARGC_ERR_MSG(2));
    CBL_TYPE_ASSERT(env, info[0].IsString(), CBL_ARGTYPE_ERR_MSG(0, string));
    CBL_TYPE_ASSERT(env, info[1].IsString(), CBL_ARGTYPE_ERR_MSG(1, string));

    std::string name = info[0].As<Napi::String>();
    std::string inDir = info[1].As<Napi::String>();
    try { 
        cbl::Database::deleteDatabase(name, inDir);
    } CATCH_AND_ASSIGN_VOID(env)
}

Napi::Value Database::get_name(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    return Napi::String::New(env, _inner.name());
}

Napi::Value Database::get_path(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    return Napi::String::New(env, _inner.path());
}

Napi::Value Database::get_config(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    return _config->Value();
}

Napi::Value Database::getScopeNames(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    try {
        auto cblVal = _inner.getScopeNames();
        return toJSValue(env, cblVal); 
    } CATCH_AND_ASSIGN(env);
}

Napi::Value Database::getCollectionNames(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() <= 1, CBL_ARGC_ERR_MSG(0 or 1));

    fleece::MutableArray cblVal;
    try {
        if(info.Length() == 0) {
            cblVal = _inner.getCollectionNames();
        } else {
            CBL_TYPE_ASSERT(env, info[0].IsString(), CBL_ARGTYPE_ERR_MSG(0, string));
            std::string scope = info[0].As<Napi::String>();
            cblVal = _inner.getCollectionNames(scope);
        } 
    } CATCH_AND_ASSIGN(env);

    return toJSValue(env, cblVal);
}

Napi::Value Database::getCollection(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 1 || info.Length() == 2,
        CBL_ARGC_ERR_MSG(1 or 2));

    CBL_TYPE_ASSERT(env, info[0].IsString(), CBL_ARGTYPE_ERR_MSG(0, string));

    if(info.Length() == 1) {
        std::string name = info[0].As<Napi::String>();
        return cbl_get_constructor(env, "Collection").New({Value(), Napi::Boolean::New(env, false), info[0]});
    }

    CBL_TYPE_ASSERT(env, info[1].IsString(), CBL_ARGTYPE_ERR_MSG(1, string));
    return cbl_get_constructor(env, "Collection").New({Value(), Napi::Boolean::New(env, false), info[0], info[1]});
}

Napi::Value Database::createCollection(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 1 || info.Length() == 2,
        CBL_ARGC_ERR_MSG(1 or 2));

    CBL_TYPE_ASSERT(env, info[0].IsString(), CBL_ARGTYPE_ERR_MSG(0, string));

    if(info.Length() == 1) {
        std::string name = info[0].As<Napi::String>();
        return cbl_get_constructor(env, "Collection").New({Value(), Napi::Boolean::New(env, true), info[0]});
    }

    CBL_TYPE_ASSERT(env, info[1].IsString(), CBL_ARGTYPE_ERR_MSG(1, string));
    return cbl_get_constructor(env, "Collection").New({Value(), Napi::Boolean::New(env, true), info[0], info[1]});
}

void Database::deleteCollection(const Napi::CallbackInfo& info) { 
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 1 || info.Length() == 2,
        CBL_ARGC_ERR_MSG(1 or 2));

    CBL_TYPE_ASSERT(env, info[0].IsString(), CBL_ARGTYPE_ERR_MSG(0, string));
    std::string name = info[0].As<Napi::String>();
    try {
        if(info.Length() == 1) {
            _inner.deleteCollection(name);
        } else {
            CBL_TYPE_ASSERT(env, info[1].IsString(), CBL_ARGTYPE_ERR_MSG(1, string));
            std::string scope = info[1].As<Napi::String>();
            _inner.deleteCollection(name, scope);
        } 
    } CATCH_AND_ASSIGN_VOID(env);
}

Napi::Value Database::getDefaultCollection(const Napi::CallbackInfo& info) { 
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    return cbl_get_constructor(env, "Collection").New({Value(), Napi::Boolean::New(env, false)});
}

void Database::close(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    try {
        _inner.close();
    } CATCH_AND_ASSIGN_VOID(env)
}

void Database::deleteDb(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    try {
        _inner.deleteDatabase();
    } CATCH_AND_ASSIGN_VOID(env)
}

Napi::Value Database::createQuery(const Napi::CallbackInfo& info) {
    return cbl_get_constructor(info.Env(), "Query").New({Value(), info[0], info[1]});
}

#define MY_STATIC_METHOD(method) CBL_STATIC_METHOD(Database, method)
#define MY_INSTANCE_METHOD(method) CBL_INSTANCE_METHOD(Database, method)
#define MY_GETTER(method) CBL_GETTER(Database, method)

Napi::Object Database::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Database", {
        MY_STATIC_METHOD(exists),
        MY_STATIC_METHOD(copyDatabase),
        MY_STATIC_METHOD(deleteDatabase),
        MY_GETTER(name),
        MY_GETTER(path),
        MY_GETTER(config),
        MY_INSTANCE_METHOD(getScopeNames),
        MY_INSTANCE_METHOD(getCollectionNames),
        MY_INSTANCE_METHOD(getCollection),
        MY_INSTANCE_METHOD(createCollection),
        MY_INSTANCE_METHOD(deleteCollection),
        MY_INSTANCE_METHOD(getDefaultCollection),
        MY_INSTANCE_METHOD(close),
        InstanceMethod<&Database::deleteDb>("deleteDatabase"),
        MY_INSTANCE_METHOD(createQuery)
    });

    cbl_init_object(exports, "Database", func);

    return exports;
}