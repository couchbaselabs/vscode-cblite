#pragma once

#include <napi.h>

template<typename MyType, typename WrappedType>
class CouchbaseWrapper : public Napi::ObjectWrap<MyType> {
public:
    CouchbaseWrapper(const Napi::CallbackInfo& info)
        :Napi::ObjectWrap<MyType>(info)
    {

    }

    void setInner(const WrappedType& inner) { _inner = inner; }

    operator WrappedType() { return _inner; }

protected:
    WrappedType _inner{};
};