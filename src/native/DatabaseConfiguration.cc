#include "DatabaseConfiguration.hh"
#include <iostream>

DatabaseConfiguration::DatabaseConfiguration(const Napi::CallbackInfo& info)
    : CouchbaseWrapper(info)
{
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));
}

Napi::Value DatabaseConfiguration::get_directory(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));
        
    if(_inner.directory) {
        return Napi::String::New(env, _directory);
    }

    return env.Undefined();
}

void DatabaseConfiguration::set_directory(const Napi::CallbackInfo& info, const Napi::Value& val) {
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, val.IsString(), CBL_ACCESSOR_TYPE_ERR_MSG(string));

    _directory = val.ToString();
    _inner.directory = FLStr(_directory.c_str());
}

Napi::Value DatabaseConfiguration::get_encryptionKey(const Napi::CallbackInfo& info) {
    #ifndef COUCHBASE_ENTERPRISE
    NAPI_THROW(Napi::Error::New(info.Env(), "Not supported in community edition"));
    #else
    if(_encryptionKey) {
        return _encryptionKey->Value();
    }

    return info.Env().Undefined();
    #endif
}

void DatabaseConfiguration::set_encryptionKey(const Napi::CallbackInfo& info, const Napi::Value& val) {
    auto env = info.Env();
    #ifndef COUCHBASE_ENTERPRISE
    NAPI_THROW_VOID(Napi::Error::New(env, "Not supported in community edition"));
    #else
    CBL_TYPE_ASSERT(env, val.IsObject(), CBL_ACCESSOR_TYPE_ERR_MSG(object));

    EncryptionKey* passed = Napi::ObjectWrap<EncryptionKey>::Unwrap(val.As<Napi::Object>());
    _encryptionKey = passed;
    _inner.encryptionKey = *passed;
    #endif
}

EncryptionKey::EncryptionKey(const Napi::CallbackInfo& info)
#ifdef COUCHBASE_ENTERPRISE
    :CouchbaseWrapper(info)
#else
    :ObjectWrap(info)
#endif
{
    auto env = info.Env();
    #ifndef COUCHBASE_ENTERPRISE
    NAPI_THROW(Napi::Error::New(env, "Not supported in community edition"));
    #else
    CBL_TYPE_ASSERT(env, info.Length() == 0 || info.Length() == 2, CBL_ARGC_ERR_MSG(0 or 2));
    if(info.Length() == 2) {
        CBL_TYPE_ASSERT(env, info[0].IsNumber(), CBL_ARGTYPE_ERR_MSG(0, number));
        CBL_TYPE_ASSERT(env, info[1].IsTypedArray() || info[1].IsArrayBuffer(), 
            CBL_ARGTYPE_ERR_MSG(1, Uint8Array | ArrayBuffer));

        size_t len = setBytes(env, info[1]);
        CBLEncryptionAlgorithm algorithm = (CBLEncryptionAlgorithm)info[0].ToNumber().Int32Value();
        switch(algorithm) {
            case kCBLEncryptionNone:
                CBL_ASSERT(env, len == 0, "Invalid byte array size (expected 0 for 'None')");
                break;
            case kCBLEncryptionAES256:
                CBL_ASSERT(env, len == kCBLEncryptionKeySizeAES256, 
                    "Invalid byte array size (expected 32 for 'AES256')");
                break;
            default:
                CBL_ASSERT(env, false, "Invalid algorithm type passed");
        }

        _inner.algorithm = algorithm;
    }
    #endif
}

Napi::Value EncryptionKey::get_algorithm(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    #ifndef COUCHBASE_ENTERPRISE
    NAPI_THROW(Napi::Error::New(env, "Not supported in community edition"));
    #else
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    return Napi::Number::New(env, _inner.algorithm);
    #endif
}

void EncryptionKey::set_algorithm(const Napi::CallbackInfo& info, const Napi::Value& value) {
    auto env = info.Env();
    #ifndef COUCHBASE_ENTERPRISE
    NAPI_THROW_VOID(Napi::Error::New(env, "Not supported in community edition"));
    #else
    CBL_TYPE_ASSERT(env, value.IsNumber(), CBL_ACCESSOR_TYPE_ERR_MSG(number));
    _inner.algorithm = (CBLEncryptionAlgorithm)info[0].ToNumber().Int32Value();
    #endif
}

Napi::Value EncryptionKey::get_bytes(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    #ifndef COUCHBASE_ENTERPRISE
    NAPI_THROW(Napi::Error::New(env, "Not supported in community edition"));
    #else
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    return Napi::ArrayBuffer::New(env, _inner.bytes, 32);
    #endif
}

void EncryptionKey::set_bytes(const Napi::CallbackInfo& info, const Napi::Value& val) {
    auto env = info.Env();
    #ifndef COUCHBASE_ENTERPRISE
    NAPI_THROW_VOID(Napi::Error::New(env, "Not supported in community edition"));
    #else
    CBL_TYPE_ASSERT(env, val.IsTypedArray() || val.IsArrayBuffer(),
        CBL_ACCESSOR_TYPE_ERR_MSG(Uint8Array | ArrayBuffer));

    setBytes(env, val);
    #endif
}

size_t EncryptionKey::setBytes(Napi::Env& env, Napi::Value val) {
    #ifndef COUCHBASE_ENTERPRISE
    return 0;
    #else
    uint8_t* buffer;
    size_t len;
    if(val.IsTypedArray()) {
        buffer = val.As<Napi::Uint8Array>().Data();
        len = val.As<Napi::Uint8Array>().ByteLength();
    } else if(val.IsArrayBuffer()) {
        buffer = (uint8_t *)val.As<Napi::ArrayBuffer>().Data();
        len = val.As<Napi::ArrayBuffer>().ByteLength();
    } else {
        CBL_ASSERT_RET1(env, false, "Invalid parameter type", (size_t)-1);
    }

    CBL_ASSERT_RET1(env, len <= 32, "Passed buffer is too large", (size_t)-1);
    memcpy(_inner.bytes, buffer, len);
    return len;
    #endif
}

Napi::Value EncryptionKey::createFromPassword(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    #ifndef COUCHBASE_ENTERPRISE
    NAPI_THROW(Napi::Error::New(env, "Not supported in community edition"));
    #else
    CBL_TYPE_ASSERT(env, info.Length() == 1, CBL_ARGC_ERR_MSG(1));
    CBL_TYPE_ASSERT(env, info[0].IsString(), CBL_ARGTYPE_ERR_MSG(1, string));
    auto pw = (std::string)info[0].As<Napi::String>();

    CBLEncryptionKey key;
    if(!CBLEncryptionKey_FromPassword(&key, FLStr(pw.c_str()))) {
        NAPI_THROW(Napi::Error::New(env, "Failed to create key from password"), env.Undefined());
    }

    Napi::Object retVal = cbl_get_constructor("EncryptionKey").New({});
    auto* unwrapped = ObjectWrap<EncryptionKey>::Unwrap(retVal);
    unwrapped->setInner(key);
    return retVal;
    #endif
}

#if CBLITE_VERSION_NUMBER >= 3001000
Napi::Value EncryptionKey::createFromPasswordOld(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    #ifndef COUCHBASE_ENTERPRISE
    NAPI_THROW(Napi::Error::New(env, "Not supported in community edition"));
    #else
    CBL_TYPE_ASSERT(env, info.Length() == 1, CBL_ARGC_ERR_MSG(1));
    CBL_TYPE_ASSERT(env, info[0].IsString(), CBL_ARGTYPE_ERR_MSG(1, string));
    auto pw = (std::string)info[0].As<Napi::String>();

    CBLEncryptionKey key;
    if(!CBLEncryptionKey_FromPasswordOld(&key, FLStr(pw.c_str()))) {
        NAPI_THROW(Napi::Error::New(env, "Failed to create key from password"), env.Undefined());
    }

    Napi::Object retVal = cbl_get_constructor("EncryptionKey").New({});
    auto* unwrapped = ObjectWrap<EncryptionKey>::Unwrap(retVal);
    unwrapped->setInner(key);
    return retVal;
    #endif
}
#endif


#define MY_GETTER_SETTER(x) CBL_GETTER_SETTER(EncryptionKey, x)
#define MY_STATIC_METHOD(x) CBL_STATIC_METHOD(EncryptionKey, x)

Napi::Object EncryptionKey::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "EncryptionKey", {
        MY_GETTER_SETTER(algorithm),
        MY_GETTER_SETTER(bytes),
        MY_STATIC_METHOD(createFromPassword),
        #if CBLITE_VERSION_NUMBER >= 3001000
        MY_STATIC_METHOD(createFromPasswordOld)
        #endif
    });

    cbl_init_object(exports, "EncryptionKey", func);
    return exports;
}

#undef MY_INSTANCE_METHOD
#undef MY_GETTER_SETTER
#define MY_GETTER_SETTER(x) CBL_GETTER_SETTER(DatabaseConfiguration, x)

Napi::Object DatabaseConfiguration::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "DatabaseConfiguration", {
        MY_GETTER_SETTER(directory),
        MY_GETTER_SETTER(encryptionKey)
    });

    cbl_init_object(exports, "DatabaseConfiguration", func);
    return exports;
}
