#include "Document.hh"
#include "Collection.hh"
#include <iostream>

template<typename T>
static Napi::Value get_id(T instance, const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    return Napi::String::New(env, instance.id());
}

template<typename T>
static Napi::Value get_revisionID(T instance, const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    return Napi::String::New(env, instance.revisionID());
}

template<typename T>
static Napi::Value get_sequence(T instance, const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    return Napi::BigInt::New(env, instance.sequence());
}

template<typename T>
static Napi::Value get_collection(T instance, const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    auto* retVal = Napi::ObjectWrap<Collection>::Unwrap(cbl_get_constructor(env, "Collection").New({}));
    retVal->setInner(instance.collection());
    return retVal->Value();
}

template<typename T>
static Napi::Value propertiesAsJSON(T instance, const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    auto retVal = instance.propertiesAsJSON();
    return Napi::String::New(env, (const char *)retVal.buf, retVal.size);
}

Document::Document(const Napi::CallbackInfo& info)
    :CouchbaseWrapper(info)
{
    CBL_TYPE_ASSERT(info.Env(), info.Length() == 0, CBL_ARGC_ERR_MSG(0));
}

Napi::Value Document::get_id(const Napi::CallbackInfo& info) {
    return ::get_id(_inner, info);
}

Napi::Value Document::get_revisionID(const Napi::CallbackInfo& info) {
    return ::get_revisionID(_inner, info);
}

Napi::Value Document::get_sequence(const Napi::CallbackInfo& info) {
    return ::get_sequence(_inner, info);
}

Napi::Value Document::get_collection(const Napi::CallbackInfo& info) {
    return ::get_collection(_inner, info);
}

Napi::Value Document::propertiesAsJSON(const Napi::CallbackInfo& info) {
    return ::propertiesAsJSON(_inner, info);
}

void Document::syncFleeceProperties(Napi::Env env) {
    auto fleeceProperties = _inner.properties();
    for(fleece::Dict::iterator i(fleeceProperties); i; ++i) {
        std::string nextKey = i.keyString().asString();
        Value().Set(nextKey, toJSValue(env, i.value()));
    }
}

MutableDocument::MutableDocument(const Napi::CallbackInfo& info) 
    :CouchbaseWrapper(info)
{
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, info.Length() <= 1, CBL_ARGC_ERR_MSG(<= 1));
    if(info.Length() == 1) {
        CBL_TYPE_ASSERT(env, info[0].IsString(), CBL_ARGTYPE_ERR_MSG(0, string));
        std::string id = info[0].As<Napi::String>();
        _inner = cbl::MutableDocument(id);
    } else {
        _inner = cbl::MutableDocument(nullptr);
    }
}

Napi::Value MutableDocument::get_id(const Napi::CallbackInfo& info) {
    return ::get_id(_inner, info);
}

Napi::Value MutableDocument::get_revisionID(const Napi::CallbackInfo& info) {
    return ::get_revisionID(_inner, info);
}

Napi::Value MutableDocument::get_sequence(const Napi::CallbackInfo& info) {
    return ::get_sequence(_inner, info);
}

Napi::Value MutableDocument::get_collection(const Napi::CallbackInfo& info) {
    return ::get_collection(_inner, info);
}

Napi::Value MutableDocument::propertiesAsJSON(const Napi::CallbackInfo& info) {
    return ::propertiesAsJSON(_inner, info);
}

void MutableDocument::setPropertiesAsJSON(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, info.Length() == 1, CBL_ARGC_ERR_MSG(1));
    CBL_TYPE_ASSERT(env, info[0].IsString(), CBL_ARGTYPE_ERR_MSG(0, string));

    std::string json = info[0].As<Napi::String>();
    try {
        _inner.setPropertiesAsJSON(json);
        syncFleeceProperties(env);
    } CATCH_AND_ASSIGN_VOID(env)
}

void MutableDocument::syncJSProperties(Napi::Env env) {
    auto fleeceProperties = _inner.properties().mutableCopy();
    serializeToFleeceDict(env, fleeceProperties, Value());
    _inner.setProperties(fleeceProperties);
}

void MutableDocument::syncFleeceProperties(Napi::Env env) {
    auto fleeceProperties = _inner.properties();
    for(fleece::Dict::iterator i(fleeceProperties); i; ++i) {
        Value().Set((std::string)i.keyString(), toJSValue(env, i.value()));
    }
}

#define MY_INSTANCE_METHOD(method) CBL_INSTANCE_METHOD(Document, method)
#define MY_GETTER(method) CBL_GETTER(Document, method)

Napi::Object Document::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Document", {
        MY_GETTER(id),
        MY_GETTER(revisionID),
        MY_GETTER(sequence),
        MY_GETTER(collection),
        MY_INSTANCE_METHOD(propertiesAsJSON)
    });

    cbl_init_object(exports, "Document", func);

    return exports;
}

#undef MY_INSTANCE_METHOD
#undef MY_GETTER
#define MY_INSTANCE_METHOD(method) CBL_INSTANCE_METHOD(MutableDocument, method)
#define MY_GETTER(method) CBL_GETTER(MutableDocument, method)

Napi::Object MutableDocument::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "MutableDocument", {
        MY_GETTER(id),
        MY_GETTER(revisionID),
        MY_GETTER(sequence),
        MY_GETTER(collection),
        MY_INSTANCE_METHOD(propertiesAsJSON),
        MY_INSTANCE_METHOD(setPropertiesAsJSON)
    });

    cbl_init_object(exports, "MutableDocument", func);

    return exports;
}