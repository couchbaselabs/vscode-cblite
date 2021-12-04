#include "Database.hh"
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
    } CATCH_AND_ASSIGN(env)
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
    if(info.Length() == 3) {
        CBL_TYPE_ASSERT(env, info[2].IsObject(), CBL_ARGTYPE_ERR_MSG(2, object));
        auto* config = Napi::ObjectWrap<DatabaseConfiguration>::Unwrap(info[2].As<Napi::Object>());
        cbl::Database::copyDatabase(from, to, *config);
    } else {
        cbl::Database::copyDatabase(from, to);
    }
}

void Database::deleteDatabase(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, info.Length() == 2, CBL_ARGC_ERR_MSG(2));
    CBL_TYPE_ASSERT(env, info[0].IsString(), CBL_ARGTYPE_ERR_MSG(0, string));
    CBL_TYPE_ASSERT(env, info[1].IsString(), CBL_ARGTYPE_ERR_MSG(1, string));

    std::string name = info[0].As<Napi::String>();
    std::string inDir = info[1].As<Napi::String>();
    cbl::Database::deleteDatabase(name, inDir);
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

Napi::Value Database::get_count(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    return Napi::BigInt::New(env, _inner.count());
}

Napi::Value Database::get_config(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    return _config->Value();
}

void Database::close(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    _inner.close();
}

void Database::deleteDb(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    _inner.deleteDatabase();
}

Napi::Value Database::getDocument(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 1, CBL_ARGC_ERR_MSG(1));
    CBL_TYPE_ASSERT_RET(env, info[0].IsString(), CBL_ARGTYPE_ERR_MSG(0, string));

    auto retVal = ObjectWrap<Document>::Unwrap(cbl_get_constructor("Document").New({}));
    std::string id = info[0].As<Napi::String>();
    auto inner = _inner.getDocument(id);
    retVal->setInner(inner);
    retVal->syncFleeceProperties(env);
    return retVal->Value();
}

Napi::Value Database::getMutableDocument(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 1, CBL_ARGC_ERR_MSG(1));
    CBL_TYPE_ASSERT_RET(env, info[0].IsString(), CBL_ARGTYPE_ERR_MSG(0, string));

    auto retVal = ObjectWrap<MutableDocument>::Unwrap(cbl_get_constructor("MutableDocument").New({}));
    std::string id = info[0].As<Napi::String>();
    auto inner = _inner.getMutableDocument(id);
    retVal->setInner(inner);
    retVal->syncFleeceProperties(env);
    return retVal->Value();
}

void Database::saveDocument(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, info.Length() == 1, CBL_ARGC_ERR_MSG(1));
    CBL_TYPE_ASSERT(env, info[0].IsObject(), CBL_ARGTYPE_ERR_MSG(0, object));

    auto doc = ObjectWrap<MutableDocument>::Unwrap(info[0].As<Napi::Object>());
    doc->syncJSProperties(env);
    cbl::MutableDocument cblDoc = *doc;
    _inner.saveDocument(cblDoc);
}

void Database::deleteDocument(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, info.Length() == 1, CBL_ARGC_ERR_MSG(1));
    CBL_TYPE_ASSERT(env, info[0].IsObject(), CBL_ARGTYPE_ERR_MSG(0, object));

    auto doc = ObjectWrap<Document>::Unwrap(info[0].As<Napi::Object>());
    cbl::Document cblDoc = *doc;
    _inner.deleteDocument(cblDoc);
}

void Database::createValueIndex(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, info.Length() == 2, CBL_ARGC_ERR_MSG(2));
    CBL_TYPE_ASSERT(env, info[0].IsString(), CBL_ARGTYPE_ERR_MSG(0, string));
    CBL_TYPE_ASSERT(env, info[1].IsObject(), CBL_ARGTYPE_ERR_MSG(1, object));

    std::string name = info[0].As<Napi::String>();
    auto* config = ObjectWrap<ValueIndexConfiguration>::Unwrap(info[1].As<Napi::Object>());
    _inner.createValueIndex(name, *config);
}

void Database::createFullTextIndex(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, info.Length() == 2, CBL_ARGC_ERR_MSG(2));
    CBL_TYPE_ASSERT(env, info[0].IsString(), CBL_ARGTYPE_ERR_MSG(0, string));
    CBL_TYPE_ASSERT(env, info[1].IsObject(), CBL_ARGTYPE_ERR_MSG(1, object));

    std::string name = info[0].As<Napi::String>();
    auto* config = ObjectWrap<FullTextIndexConfiguration>::Unwrap(info[1].As<Napi::Object>());
    _inner.createFullTextIndex(name, *config);
}

void Database::deleteIndex(const Napi::CallbackInfo& info) {
auto env = info.Env();
    CBL_TYPE_ASSERT(env, info.Length() == 1, CBL_ARGC_ERR_MSG(1));
    CBL_TYPE_ASSERT(env, info[0].IsString(), CBL_ARGTYPE_ERR_MSG(0, string));

    std::string name = info[0].As<Napi::String>();
    _inner.deleteIndex(name);
}

Napi::Value Database::getIndexNames(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));
    auto names = _inner.getIndexNames();
    return toJSValue(env, names);
}

Napi::Value Database::createQuery(const Napi::CallbackInfo& info) {
    return cbl_get_constructor("Query").New({Value(), info[0], info[1]});
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
        MY_GETTER(count),
        MY_GETTER(config),
        MY_INSTANCE_METHOD(close),
        InstanceMethod<&Database::deleteDb>("deleteDatabase"),
        MY_INSTANCE_METHOD(getDocument),
        MY_INSTANCE_METHOD(getMutableDocument),
        MY_INSTANCE_METHOD(saveDocument),
        MY_INSTANCE_METHOD(deleteDocument),
        MY_INSTANCE_METHOD(createValueIndex),
        MY_INSTANCE_METHOD(createFullTextIndex),
        MY_INSTANCE_METHOD(deleteIndex),
        MY_INSTANCE_METHOD(getIndexNames),
        MY_INSTANCE_METHOD(createQuery)
    });

    cbl_init_object(exports, "Database", func);

    return exports;
}