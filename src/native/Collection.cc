#include "Collection.hh"
#include "Query.hh"
#include "Database.hh"
#include "Document.hh"

#include <iostream>

Collection::Collection(const Napi::CallbackInfo& info)
    :CouchbaseWrapper(info)
{
    if(info.Length() == 0) {
        // Shell for incoming already created
        // native object
        return;
    }

    auto env = info.Env();
    CBL_TYPE_ASSERT(env, info.Length() >= 2 && info.Length() <= 4,
         CBL_ARGC_ERR_MSG(>= 2 or <= 4));

    CBL_TYPE_ASSERT(env, info[0].IsObject(), CBL_ARGTYPE_ERR_MSG(0, object));
    CBL_TYPE_ASSERT(env, info[1].IsBoolean(), CBL_ARGTYPE_ERR_MSG(1, boolean));

    auto* db = ObjectWrap<Database>::Unwrap(info[0].As<Napi::Object>());
    cbl::Database cblDb = *db;
    if(info.Length() == 2) {
        // Default collection, bool ignored
        try {
            _inner = cblDb.getDefaultCollection();
        } CATCH_AND_ASSIGN_VOID(env);
    } else if(info.Length() == 3) {
        // Named collection in default scope
        CBL_TYPE_ASSERT(env, info[2].IsString(), CBL_ARGTYPE_ERR_MSG(2, string));
        bool create = info[1].As<Napi::Boolean>();
        std::string name = info[2].As<Napi::String>();
        try {
            _inner = create
                ? cblDb.createCollection(name)
                : cblDb.getCollection(name);
        } CATCH_AND_ASSIGN_VOID(env);
    } else {
        // Named collection in named scope
        CBL_TYPE_ASSERT(env, info[2].IsString(), CBL_ARGTYPE_ERR_MSG(2, string));
        CBL_TYPE_ASSERT(env, info[3].IsString(), CBL_ARGTYPE_ERR_MSG(3, string));
        bool create = info[1].As<Napi::Boolean>();
        std::string name = info[2].As<Napi::String>();
        std::string scope = info[3].As<Napi::String>();
        try {
            _inner = create
                ? cblDb.createCollection(name, scope)
                : cblDb.getCollection(name, scope);
        } CATCH_AND_ASSIGN_VOID(env);
    }
}

Napi::Value Collection::get_name(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    return Napi::String::New(env, _inner.name().c_str());
}

Napi::Value Collection::get_scopeName(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    return Napi::String::New(env, _inner.scopeName().c_str());
}

Napi::Value Collection::get_count(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    return Napi::BigInt::New(env, _inner.count());
}

Napi::Value Collection::getDocument(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 1, CBL_ARGC_ERR_MSG(1));
    CBL_TYPE_ASSERT_RET(env, info[0].IsString(), CBL_ARGTYPE_ERR_MSG(0, string));

    auto retVal = ObjectWrap<Document>::Unwrap(cbl_get_constructor(env, "Document").New({}));
    std::string id = info[0].As<Napi::String>();
    try {
        auto inner = _inner.getDocument(id);
        retVal->setInner(inner);
        retVal->syncFleeceProperties(env);
        return retVal->Value();
    } CATCH_AND_ASSIGN(env)
}

Napi::Value Collection::getMutableDocument(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 1, CBL_ARGC_ERR_MSG(1));
    CBL_TYPE_ASSERT_RET(env, info[0].IsString(), CBL_ARGTYPE_ERR_MSG(0, string));

    auto retVal = ObjectWrap<MutableDocument>::Unwrap(cbl_get_constructor(env, "MutableDocument").New({}));
    std::string id = info[0].As<Napi::String>();
    try {
        auto inner = _inner.getMutableDocument(id);
        retVal->setInner(inner);
        retVal->syncFleeceProperties(env);
        return retVal->Value();
    } CATCH_AND_ASSIGN(env)
}

void Collection::saveDocument(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, info.Length() == 1, CBL_ARGC_ERR_MSG(1));
    CBL_TYPE_ASSERT(env, info[0].IsObject(), CBL_ARGTYPE_ERR_MSG(0, object));

    auto doc = ObjectWrap<MutableDocument>::Unwrap(info[0].As<Napi::Object>());
    cbl::MutableDocument cblDoc = *doc;
    try {
        _inner.saveDocument(cblDoc);
        doc->syncJSProperties(env);
    } CATCH_AND_ASSIGN_VOID(env);
}

void Collection::deleteDocument(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, info.Length() == 1, CBL_ARGC_ERR_MSG(1));
    CBL_TYPE_ASSERT(env, info[0].IsObject(), CBL_ARGTYPE_ERR_MSG(0, object));

    auto doc = ObjectWrap<Document>::Unwrap(info[0].As<Napi::Object>());
    cbl::Document cblDoc = *doc;
    try {
        _inner.deleteDocument(cblDoc);
    } CATCH_AND_ASSIGN_VOID(env)
}

void Collection::createValueIndex(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, info.Length() == 2, CBL_ARGC_ERR_MSG(2));
    CBL_TYPE_ASSERT(env, info[0].IsString(), CBL_ARGTYPE_ERR_MSG(0, string));
    CBL_TYPE_ASSERT(env, info[1].IsObject(), CBL_ARGTYPE_ERR_MSG(1, object));

    std::string name = info[0].As<Napi::String>();
    auto* config = ObjectWrap<ValueIndexConfiguration>::Unwrap(info[1].As<Napi::Object>());
    try {
        _inner.createValueIndex(name, *config);
    } CATCH_AND_ASSIGN_VOID(env)
}

void Collection::createFullTextIndex(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, info.Length() == 2, CBL_ARGC_ERR_MSG(2));
    CBL_TYPE_ASSERT(env, info[0].IsString(), CBL_ARGTYPE_ERR_MSG(0, string));
    CBL_TYPE_ASSERT(env, info[1].IsObject(), CBL_ARGTYPE_ERR_MSG(1, object));

    std::string name = info[0].As<Napi::String>();
    auto* config = ObjectWrap<FullTextIndexConfiguration>::Unwrap(info[1].As<Napi::Object>());
    try {
        _inner.createFullTextIndex(name, *config);
    } CATCH_AND_ASSIGN_VOID(env)
}

void Collection::deleteIndex(const Napi::CallbackInfo& info) {
auto env = info.Env();
    CBL_TYPE_ASSERT(env, info.Length() == 1, CBL_ARGC_ERR_MSG(1));
    CBL_TYPE_ASSERT(env, info[0].IsString(), CBL_ARGTYPE_ERR_MSG(0, string));

    std::string name = info[0].As<Napi::String>();
    try {
        _inner.deleteIndex(name);
    } CATCH_AND_ASSIGN_VOID(env)
}

Napi::Value Collection::getIndexNames(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));
    auto names = _inner.getIndexNames();
    return toJSValue(env, names);
}

#define MY_INSTANCE_METHOD(method) CBL_INSTANCE_METHOD(Collection, method)
#define MY_GETTER(method) CBL_GETTER(Collection, method)

Napi::Object Collection::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Collection", {
        MY_GETTER(name),
        MY_GETTER(scopeName),
        MY_GETTER(count),
        MY_INSTANCE_METHOD(getDocument),
        MY_INSTANCE_METHOD(getMutableDocument),
        MY_INSTANCE_METHOD(saveDocument),
        MY_INSTANCE_METHOD(deleteDocument),
        MY_INSTANCE_METHOD(createValueIndex),
        MY_INSTANCE_METHOD(createFullTextIndex),
        MY_INSTANCE_METHOD(deleteIndex),
        MY_INSTANCE_METHOD(getIndexNames)
    });

    cbl_init_object(exports, "Collection", func);
    return exports;
}