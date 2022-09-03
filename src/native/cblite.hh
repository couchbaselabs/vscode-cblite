#pragma once

#include <napi.h>
#include <vector>
#include <sstream>
#include "cbl++/CouchbaseLite.hh"

namespace fleece {
    class Value;
    class MutableArray;
    class MutableDict;
}

#define CBL_CLASS_BOILERPLATE(name) \
    static Napi::Object Init(Napi::Env env, Napi::Object exports); \
    name(const Napi::CallbackInfo& info)

#define CBL_GETSET(name) \
    Napi::Value get_##name(const Napi::CallbackInfo&); \
    void set_##name(const Napi::CallbackInfo&, const Napi::Value&)

#define CBL_INSTANCE_METHOD(Class, Method) InstanceMethod<&Class::Method>(#Method)
#define CBL_STATIC_METHOD(Class, Method) StaticMethod<&Class::Method>(#Method)
#define CBL_GETTER_SETTER(Class, Name) InstanceAccessor<&Class::get_##Name, &Class::set_##Name>(#Name)
#define CBL_GETTER(Class, Name) InstanceAccessor<&Class::get_##Name>(#Name)

#define CBL_TYPE_ASSERT(env, condition, message) \
    if(!(condition)) { \
        NAPI_THROW_VOID(Napi::TypeError::New(env, message)); \
    }

#define CBL_TYPE_ASSERT_RET(env, condition, message) \
    if(!(condition)) { \
        NAPI_THROW(Napi::TypeError::New(env, message), env.Undefined()); \
    }

#define CBL_ASSERT(env, condition, message) \
    if(!(condition)) { \
        NAPI_THROW_VOID(Napi::Error::New(env, message)); \
    }

#define CBL_ASSERT_RET(env, condition, message) \
    if(!(condition)) { \
        NAPI_THROW(Napi::Error::New(env, message), env.Undefined()); \
    }

#define CBL_ASSERT_RET1(env, condition, message, retVal) \
    if(!(condition)) { \
        NAPI_THROW(Napi::Error::New(env, message), retVal); \
    }

Napi::Object cbl_init_object(Napi::Object& exports, const char* name, Napi::Function& func);
Napi::FunctionReference& cbl_get_constructor(const Napi::Env& env, const char* name);
Napi::Value toJSValue(Napi::Env env, const fleece::Value& val);
void serializeToFleeceArray(Napi::Env env, fleece::MutableArray& array, const Napi::Array& val);
void serializeToFleeceDict(Napi::Env env, fleece::MutableDict& dict, const Napi::Object& val);

#define CBL_ARGC_ERR_MSG(x) "Incorrect number of arguments (expected " #x ")"
#define CBL_ARGTYPE_ERR_MSG(p, t) "Incorrect type for argument " #p " (expected " #t ")"
#define CBL_ACCESSOR_TYPE_ERR_MSG(t) "Incorrect type for accessor (expected " #t ")"

#define CATCH_AND_ASSIGN_VOID(env) \
catch(CBLError& e) { \
    auto msg = "Couchbase Lite Error " + std::to_string(e.domain) + " / " + \
        std::to_string(e.code) + " " + (std::string)CBLError_Message(&e); \
    auto err = Napi::Error::New(env, msg); \
    err.Set("code", Napi::Number::New(env, e.code)); \
    err.Set("domain", Napi::Number::New(env, e.domain)); \
    NAPI_THROW_VOID(err); \
} catch(std::exception& e) { \
    NAPI_THROW_VOID(Napi::Error::New(env, e.what())); \
} catch(...) { \
    NAPI_THROW_VOID(Napi::Error::New(env, "Unknown non-standard error occurred")); \
}

#define CATCH_AND_ASSIGN(env) \
catch(CBLError& e) { \
    auto msg = "Couchbase Lite Error " + std::to_string(e.domain) + " / " + \
        std::to_string(e.code) + " " + (std::string)CBLError_Message(&e); \
    auto err = Napi::Error::New(env, msg); \
    err.Set("code", Napi::Number::New(env, e.code)); \
    err.Set("domain", Napi::Number::New(env, e.domain)); \
    NAPI_THROW(err, env.Undefined()); \
} catch(std::exception& e) { \
    NAPI_THROW(Napi::Error::New(env, e.what()), env.Undefined()); \
} catch(...) { \
    NAPI_THROW(Napi::Error::New(env, "Unknown non-standard error occurred"), env.Undefined()); \
}
