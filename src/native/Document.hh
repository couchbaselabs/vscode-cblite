#pragma once

#include "cblite.hh"
#include "CouchbaseWrapper.hh"

class MutableDocument;

class Document : public CouchbaseWrapper<Document, cbl::Document> {
public:
    CBL_CLASS_BOILERPLATE(Document);

    Napi::Value get_id(const Napi::CallbackInfo&);
    Napi::Value get_revisionID(const Napi::CallbackInfo&);
    Napi::Value get_sequence(const Napi::CallbackInfo&);
    Napi::Value get_collection(const Napi::CallbackInfo&);

    Napi::Value propertiesAsJSON(const Napi::CallbackInfo&);

    void syncFleeceProperties(Napi::Env env);
};

class MutableDocument : public CouchbaseWrapper<MutableDocument, cbl::MutableDocument> {
public:
    CBL_CLASS_BOILERPLATE(MutableDocument);

    Napi::Value get_id(const Napi::CallbackInfo&);
    Napi::Value get_revisionID(const Napi::CallbackInfo&);
    Napi::Value get_sequence(const Napi::CallbackInfo&);
    Napi::Value get_collection(const Napi::CallbackInfo&);

    Napi::Value propertiesAsJSON(const Napi::CallbackInfo&);
    void setPropertiesAsJSON(const Napi::CallbackInfo&);

    void syncJSProperties(Napi::Env env);
    void syncFleeceProperties(Napi::Env env);
};