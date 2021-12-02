#include "Query.hh"
#include "Database.hh"
#include <iostream>

template<typename T>
static Napi::Value get_expressionLanguage(T& instance, const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));
    return Napi::Number::New(env, instance.expressionLanguage);
}

template<typename T>
void set_expressionLanguage(T& instance, const Napi::CallbackInfo& info, const Napi::Value& val) {
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, val.IsNumber(), CBL_ACCESSOR_TYPE_ERR_MSG(number));
    instance.expressionLanguage = (CBLQueryLanguage)val.ToNumber().Int32Value();
}

ValueIndexConfiguration::ValueIndexConfiguration(const Napi::CallbackInfo& info) 
    :CouchbaseWrapper(info)
{
    CBL_TYPE_ASSERT(info.Env(), info.Length() == 0, CBL_ARGC_ERR_MSG(0));
}

Napi::Value ValueIndexConfiguration::get_expressionLanguage(const Napi::CallbackInfo& info) {
    return ::get_expressionLanguage(_inner, info);
}

void ValueIndexConfiguration::set_expressionLanguage(const Napi::CallbackInfo& info, const Napi::Value& val) {
    ::set_expressionLanguage(_inner, info, val);
}

Napi::Value ValueIndexConfiguration::get_expressions(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    return Napi::String::New(env, _expressions);
}

void ValueIndexConfiguration::set_expressions(const Napi::CallbackInfo& info, const Napi::Value& val) {
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, val.IsString(), CBL_ACCESSOR_TYPE_ERR_MSG(string));

    _expressions = val.As<Napi::String>();
    _inner.expressions = FLStr(_expressions.c_str());
}

FullTextIndexConfiguration::FullTextIndexConfiguration(const Napi::CallbackInfo& info) 
    :CouchbaseWrapper(info)
{
    CBL_TYPE_ASSERT(info.Env(), info.Length() == 0, CBL_ARGC_ERR_MSG(0));
}

Napi::Value FullTextIndexConfiguration::get_expressionLanguage(const Napi::CallbackInfo& info) {
    return ::get_expressionLanguage(_inner, info);
}

void FullTextIndexConfiguration::set_expressionLanguage(const Napi::CallbackInfo& info, const Napi::Value& val) {
    ::set_expressionLanguage(_inner, info, val);
}

Napi::Value FullTextIndexConfiguration::get_expressions(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    return Napi::String::New(env, _expressions);
}

void FullTextIndexConfiguration::set_expressions(const Napi::CallbackInfo& info, const Napi::Value& val) {
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, val.IsString(), CBL_ACCESSOR_TYPE_ERR_MSG(string));

    _expressions = val.As<Napi::String>();
    _inner.expressions = FLStr(_expressions.c_str());
}

Napi::Value FullTextIndexConfiguration::get_ignoreAccents(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));
    return Napi::Boolean::New(env, _inner.ignoreAccents);
}

void FullTextIndexConfiguration::set_ignoreAccents(const Napi::CallbackInfo& info, const Napi::Value& val) {
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, val.IsBoolean(), CBL_ACCESSOR_TYPE_ERR_MSG(boolean));
    _inner.ignoreAccents = val.As<Napi::Boolean>();
}

Napi::Value FullTextIndexConfiguration::get_language(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    return Napi::String::New(env, _language);;
}

void FullTextIndexConfiguration::set_language(const Napi::CallbackInfo& info, const Napi::Value& val) {
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, val.IsString(), CBL_ACCESSOR_TYPE_ERR_MSG(string));

    _language = val.As<Napi::String>();
    _inner.language = FLStr(_language.c_str());
}

Query::Query(const Napi::CallbackInfo& info) 
    :CouchbaseWrapper(info)
{
    auto env = info.Env();
    CBL_TYPE_ASSERT(env, info.Length() == 3, CBL_ARGC_ERR_MSG(3));
    CBL_TYPE_ASSERT(env, info[0].IsObject(), CBL_ARGTYPE_ERR_MSG(0, object));
    CBL_TYPE_ASSERT(env, info[1].IsNumber(), CBL_ARGTYPE_ERR_MSG(1, number));
    CBL_TYPE_ASSERT(env, info[2].IsString(), CBL_ARGTYPE_ERR_MSG(2, string));

    auto* db = ObjectWrap<Database>::Unwrap(info[0].As<Napi::Object>());
    auto language = (CBLQueryLanguage)info[1].ToNumber().Int32Value();
    auto expression = (std::string)info[2].As<Napi::String>();
    _inner = cbl::Query(*db, language, expression);
}

Napi::Value Query::columnNames(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    auto columns = _inner.columnNames();
    auto retVal = Napi::Array::New(env, columns.size());
    int index = 0;
    for(const auto& c : columns) {
        retVal.Set(index++, Napi::String::New(env, c));
    }

    return retVal;
}

Napi::Value Query::explain(const Napi::CallbackInfo& info) {
    return Napi::String::New(info.Env(), _inner.explain());
}

Napi::Value Query::execute(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    CBL_TYPE_ASSERT_RET(env, info.Length() == 0, CBL_ARGC_ERR_MSG(0));

    auto results = _inner.execute();
    Napi::Array retVal = Napi::Array::New(env);
    int index = 0;
    for(const auto& result : results) {
        Napi::Object next = Napi::Object::New(env);
        for(const auto& c : _inner.columnNames()) {
            auto val = result.valueForKey(c);
            next.Set(c, toJSValue(env, val));
        }

        retVal.Set(index++, next);
    }

    return retVal;
}

#define MY_GETTER_SETTER(name) CBL_GETTER_SETTER(ValueIndexConfiguration, name)

Napi::Object ValueIndexConfiguration::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "ValueIndexConfiguration", {
        MY_GETTER_SETTER(expressionLanguage),
        MY_GETTER_SETTER(expressions)
    });

    cbl_init_object(exports, "ValueIndexConfiguration", func);
    return exports;
}

#undef MY_GETTER_SETTER
#define MY_GETTER_SETTER(name) CBL_GETTER_SETTER(FullTextIndexConfiguration, name)

Napi::Object FullTextIndexConfiguration::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "FullTextIndexConfiguration", {
        MY_GETTER_SETTER(expressionLanguage),
        MY_GETTER_SETTER(expressions),
        MY_GETTER_SETTER(ignoreAccents),
        MY_GETTER_SETTER(language)
    });

    cbl_init_object(exports, "FullTextIndexConfiguration", func);
    return exports;
}

#undef MY_GETTER_SETTER
#define MY_INSTANCE_METHOD(method) CBL_INSTANCE_METHOD(Query, method)

Napi::Object Query::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Query", {
        MY_INSTANCE_METHOD(columnNames),
        MY_INSTANCE_METHOD(explain),
        MY_INSTANCE_METHOD(execute)
    });

    cbl_init_object(exports, "Query", func);
    return exports;
}