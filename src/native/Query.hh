#pragma once

#include "cbl++/Query.hh"
#include "cblite.hh"
#include "CouchbaseWrapper.hh"

class Database;

class ValueIndexConfiguration : public CouchbaseWrapper<ValueIndexConfiguration, CBLValueIndexConfiguration> {
public:
    CBL_CLASS_BOILERPLATE(ValueIndexConfiguration);

    CBL_GETSET(expressionLanguage);
    CBL_GETSET(expressions);

private:
    std::string _expressions;
};

class FullTextIndexConfiguration : public CouchbaseWrapper<FullTextIndexConfiguration, CBLFullTextIndexConfiguration> {
public:
    CBL_CLASS_BOILERPLATE(FullTextIndexConfiguration);

    CBL_GETSET(expressionLanguage);
    CBL_GETSET(expressions);
    CBL_GETSET(ignoreAccents);
    CBL_GETSET(language);

private:
    std::string _expressions;
    std::string _language;
};

class Query : public CouchbaseWrapper<Query, cbl::Query> {
public:
    CBL_CLASS_BOILERPLATE(Query);

    Napi::Value columnNames(const Napi::CallbackInfo&);
    Napi::Value explain(const Napi::CallbackInfo&);
    Napi::Value execute(const Napi::CallbackInfo&);
};