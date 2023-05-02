#pragma once

#include "cblite.hh"
#include "CouchbaseWrapper.hh"

class Collection : public CouchbaseWrapper<Collection, cbl::Collection> {
public:
    CBL_CLASS_BOILERPLATE(Collection);

    Napi::Value get_name(const Napi::CallbackInfo&);
    Napi::Value get_scopeName(const Napi::CallbackInfo &);
    Napi::Value get_count(const Napi::CallbackInfo &);

    Napi::Value getDocument(const Napi::CallbackInfo&);
    Napi::Value getMutableDocument(const Napi::CallbackInfo&);
    void saveDocument(const Napi::CallbackInfo&);
    void deleteDocument(const Napi::CallbackInfo&);

    void createValueIndex(const Napi::CallbackInfo&);
    void createFullTextIndex(const Napi::CallbackInfo&);
    void deleteIndex(const Napi::CallbackInfo&);
    Napi::Value getIndexNames(const Napi::CallbackInfo&);
};