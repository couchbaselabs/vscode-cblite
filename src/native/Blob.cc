#include "Blob.hh"

Blob::Blob(const Napi::CallbackInfo& info) 
    :CouchbaseWrapper(info)
{
    if(info.Length() == 0) return; // Shortcut for internal use

    auto env = info.Env();
    CBL_TYPE_ASSERT(env, info.Length() == 2, CBL_ARGC_ERR_MSG(2));
    CBL_TYPE_ASSERT(env, info[0].IsString(), CBL_ARGTYPE_ERR_MSG(0, string));
    CBL_TYPE_ASSERT(env, info[1].IsArrayBuffer() || info[1].IsTypedArray(), 
        CBL_ARGTYPE_ERR_MSG(1, ArrayBuffer | Uint8Array));

    std::string contentType = info[0].As<Napi::String>();
    if(info[1].IsArrayBuffer()) {
        auto ab = info[1].As<Napi::ArrayBuffer>();
        _content = fleece::alloc_slice(ab.Data(), ab.ByteLength());
    } else {
        auto arr = info[1].As<Napi::Uint8Array>();
        _content = fleece::alloc_slice(arr.Data(), arr.ByteLength());
    }

    _inner = cbl::Blob(contentType, _content);
}

Napi::Value Blob::get_length(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));
    return Napi::BigInt::New(env, _inner.length());
}

Napi::Value Blob::get_contentType(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    return Napi::String::New(env, _inner.contentType());
}

Napi::Value Blob::get_digest(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    return Napi::String::New(env, _inner.digest());
}

#define MY_STATIC_METHOD(method) CBL_STATIC_METHOD(Blob, method)
#define MY_GETTER(name) CBL_GETTER(Blob, name)

Napi::Object Blob::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Blob", {
        //MY_STATIC_METHOD(isBlob),
        MY_GETTER(length),
        MY_GETTER(contentType),
        MY_GETTER(digest)
    });

    cbl_init_object(exports, "Blob", func);
    return exports;
}