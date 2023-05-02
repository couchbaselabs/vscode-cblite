#include "cblite.hh"
#include "DatabaseConfiguration.hh"
#include "Database.hh"
#include "Collection.hh"
#include "Document.hh"
#include "Query.hh"
#include "fleece/Fleece.hh"
#include "Blob.hh"

#include <map>
#include <iostream>

std::map<std::string, Napi::FunctionReference> _Constructors;

Napi::Object cbl_init_object(Napi::Object& exports, const char* name, Napi::Function& func) {
    exports.Set(name, func);
    auto constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();
    _Constructors[name] = std::move(constructor);

    return exports;
}

Napi::FunctionReference& cbl_get_constructor(const Napi::Env& env, const char* name) {
    auto it = _Constructors.find(name);
    #ifdef DEBUG
    if(it == _Constructors.end()) {
        std::string msg = std::string("Missing constructor for ") + name + "; did you forget to Init it?";
        NAPI_THROW(Napi::Error::New(env, msg), env.Undefined());
    }
    #endif
    
    return it->second;
}

Napi::Value toJSValue(Napi::Env env, const fleece::Value& value) {
    switch(value.type()) {
        case kFLArray:
        {
            auto retVal = Napi::Array::New(env, value.asArray().count());
            int index = 0;
            for(fleece::Array::iterator i(value.asArray()); i; ++i) {
                retVal.Set(index++, toJSValue(env, i.value()));
            }

            return retVal;
        }
        case kFLDict:
        {
            auto dict = value.asDict();
            if(cbl::Blob::isBlob(dict)) {
                Napi::Object retVal = cbl_get_constructor(env, "Blob").New({});
                auto* blob = Napi::ObjectWrap<Blob>::Unwrap(retVal);
                blob->setInner(cbl::Blob(dict));
                return retVal;
            }

            auto retVal = Napi::Object::New(env);
            for(fleece::Dict::iterator i(dict); i; ++i) {
                std::string nextKey = i.keyString().asString();
                retVal.Set(nextKey, toJSValue(env, i.value()));
            }

            return retVal;
        }
        case kFLBoolean:
            return Napi::Boolean::New(env, value.asBool());
        case kFLNull:
            return env.Null();
        case kFLNumber:
            if(value.isInteger()) {
                if(value.isUnsigned()) {
                    return Napi::BigInt::New(env, value.asUnsigned());
                }

                return Napi::BigInt::New(env, value.asInt());
            } else {
                if(value.isDouble()) {
                    return Napi::Number::New(env, value.asDouble());
                }

                return Napi::Number::New(env, value.asFloat());
            }
        case kFLString:
            return Napi::String::New(env, value.asstring());
        default:
            break;
    }

    return env.Undefined();
}

void serializeToFleeceArray(Napi::Env env, fleece::MutableArray& array, const Napi::Array& val) {
    for(int i = 0; i < val.Length(); i++) {
        auto next = val.Get(i);
        switch(next.Type()) {
            case napi_null:
                array.appendNull();
                break;
            case napi_boolean:
                array.append((bool)next.As<Napi::Boolean>());
                break;
            case napi_number:
                // We start to see Javascript's true colors here...no numeric information
                array.append(next.As<Napi::Number>().DoubleValue());
                break;
            case napi_bigint:
                // No way I can tell to distinguish between signed and unsigned
                bool lossless;
                array.append(next.As<Napi::BigInt>().Int64Value(&lossless));
                break;
            case napi_string:
                array.append((std::string)next.As<Napi::String>());
                break;
            case napi_object:
                if(next.IsArray()) {
                    auto subArray = fleece::MutableArray::newArray();
                    serializeToFleeceArray(env, subArray, next.As<Napi::Array>());
                    array.append(subArray);
                } else {
                    auto obj = next.As<Napi::Object>();
                    if(obj.InstanceOf(cbl_get_constructor(env, "Blob").Value())) {
                        auto* blob = Napi::ObjectWrap<Blob>::Unwrap(obj);
                        array.append((cbl::Blob)*blob);
                    } else {
                        auto subDict = fleece::MutableDict::newDict();
                        serializeToFleeceDict(env, subDict, obj);
                        array.append(subDict);
                    }
                }
                break;
            default:
                CBL_ASSERT(env, false, "Invalid type in Javascript array");
        }
    }
}

void serializeToFleeceDict(Napi::Env env, fleece::MutableDict& dict, const Napi::Object& val) {
    auto keys = val.GetPropertyNames();
    for(int i = 0; i < keys.Length(); i++) {
        std::string key = keys.Get(i).As<Napi::String>();
        auto value = val.Get(key);
        switch(value.Type()) {
            case napi_null:
                dict.setNull(key);
                break;
            case napi_boolean:
                dict.set(key, (bool)value.As<Napi::Boolean>());
                break;
            case napi_number:
                dict.set(key, value.ToNumber().DoubleValue());
                break;
            case napi_bigint:
            {
                bool lossless;
                dict.set(key, value.As<Napi::BigInt>().Int64Value(&lossless));
                break;
            }
            case napi_string:
                dict.set(key, (std::string)value.As<Napi::String>());
                break;
            case napi_object:
                if(value.IsArray()) {
                    auto subArray = fleece::MutableArray::newArray();
                    serializeToFleeceArray(env, subArray, value.As<Napi::Array>());
                    dict.set(key, subArray);
                } else {
                    auto obj = value.As<Napi::Object>();
                    if(obj.InstanceOf(cbl_get_constructor(env, "Blob").Value())) {
                        auto* blob = Napi::ObjectWrap<Blob>::Unwrap(obj);
                        dict.set(key, (cbl::Blob)*blob);
                    } else {
                        auto subDict = fleece::MutableDict::newDict();
                        serializeToFleeceDict(env, subDict, obj);
                        dict.set(key, subDict);
                    }
                }
                break;
            default:
                CBL_ASSERT(env, false, "Invalid type in Javascript dict");
        }
    }
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    DatabaseConfiguration::Init(env, exports);
    EncryptionKey::Init(env, exports);
    Database::Init(env, exports);
    Collection::Init(env, exports);
    Document::Init(env, exports);
    MutableDocument::Init(env, exports);
    ValueIndexConfiguration::Init(env, exports);
    FullTextIndexConfiguration::Init(env, exports);
    Query::Init(env, exports);
    Blob::Init(env, exports);

    return exports;
}

NODE_API_MODULE(addon, Init)
