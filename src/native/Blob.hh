#pragma once

#include "cbl++/Blob.hh"
#include "cblite.hh"
#include "CouchbaseWrapper.hh"

namespace fleece {
    class alloc_slice;
}

class Blob : public CouchbaseWrapper<Blob, cbl::Blob> {
public:
    CBL_CLASS_BOILERPLATE(Blob);

    static Napi::Value isBlob(const Napi::CallbackInfo&);

    Napi::Value get_length(const Napi::CallbackInfo&);
    Napi::Value get_contentType(const Napi::CallbackInfo&);
    Napi::Value get_digest(const Napi::CallbackInfo&);

private:
    fleece::alloc_slice _content;
};