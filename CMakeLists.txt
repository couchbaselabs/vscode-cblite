project(cblite-js)
cmake_minimum_required(VERSION 3.10)
set (CMAKE_CXX_STANDARD 17)
set (CMAKE_C_STANDARD 11)
set (CMAKE_INSTALL_RPATH "\$ORIGIN")

##### REMOVE LATER WHEN C++ HEADERS ARE A PART OF THE PRODUCT #####

if(NOT IS_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/deps/include/cbl++)
    file(MAKE_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/deps/include/cbl++)
endif()

set(
    CBL_CPP_HEADERS
    "Base.hh"
    "Blob.hh"
    "CouchbaseLite.hh"
    "Database.hh"
    "Document.hh"
    "Query.hh"
    "Replicator.hh"
)

set(
    FLEECE_CPP_HEADERS
    "Fleece.hh"
    "Mutable.hh"
    "slice.hh"
)

foreach(HEADER IN LISTS CBL_CPP_HEADERS)
    if(NOT EXISTS ${CMAKE_CURRENT_SOURCE_DIR}/deps/include/cbl++/${HEADER})
        message(STATUS "Fetching cbl++ header ${HEADER}...")
        file(
            DOWNLOAD 
            "https://raw.githubusercontent.com/couchbase/couchbase-lite-C/master/include/cbl%2B%2B/${HEADER}"
            ${CMAKE_CURRENT_SOURCE_DIR}/deps/include/cbl++/${HEADER}
        )    
    endif()
endforeach()

foreach(HEADER IN LISTS FLEECE_CPP_HEADERS)
    if(NOT EXISTS ${CMAKE_CURRENT_SOURCE_DIR}/deps/include/fleece/${HEADER})
        message(STATUS "Fetching fleece header ${HEADER}...")
        file(
            DOWNLOAD 
            "https://raw.githubusercontent.com/couchbaselabs/fleece/master/API/fleece/${HEADER}"
            ${CMAKE_CURRENT_SOURCE_DIR}/deps/include/fleece/${HEADER}
        )    
    endif()
endforeach()


##### END REMOVE #####

set(
    SRC_FILES
    src/native/DatabaseConfiguration.cc
    src/native/Database.cc
    src/native/Document.cc
    src/native/Query.cc
    src/native/Blob.cc
    src/native/cblite.cc
)

include_directories(${CMAKE_JS_INC})
add_library(${PROJECT_NAME} SHARED ${SRC_FILES} ${CMAKE_JS_SRC})
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")
target_include_directories(
    ${PROJECT_NAME}
    PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/deps/include
    ${CMAKE_CURRENT_SOURCE_DIR}/node_modules/node-addon-api
)

target_compile_definitions(
    ${PROJECT_NAME}
    PUBLIC
    NAPI_VERSION=6
)

find_package(
    CouchbaseLite 3.0.0 REQUIRED
    HINTS ${CMAKE_CURRENT_SOURCE_DIR}/deps
)

target_link_libraries(
    ${PROJECT_NAME} 
    PRIVATE
    ${CMAKE_JS_LIB} 
    cblite
)

install(
    TARGETS ${PROJECT_NAME}
    DESTINATION ${CMAKE_CURRENT_SOURCE_DIR}/out/${CMAKE_SYSTEM_NAME}
)



# Install the runtime runtime files into both location (node.js and vscode extension)
file(GLOB_RECURSE LINUX_LIBS ${CouchbaseLite_DIR}/../../../libcblite.so*)
install(
    FILES 
    ${CouchbaseLite_DIR}/../../../bin/cblite.dll
    ${CouchbaseLite_DIR}/../../../lib/libcblite*.dylib
    ${LINUX_LIBS}
    DESTINATION ${CMAKE_CURRENT_SOURCE_DIR}/out/${CMAKE_SYSTEM_NAME}
    OPTIONAL
)

file(REMOVE ${CMAKE_CURRENT_SOURCE_DIR}/out/${CMAKE_SYSTEM_NAME}/cblite-js.lib)

install(
    FILES 
    ${CouchbaseLite_DIR}/../../../bin/cblite.dll
    ${CouchbaseLite_DIR}/../../../lib/libcblite*.dylib
    ${LINUX_LIBS}
    DESTINATION ${CMAKE_CURRENT_SOURCE_DIR}/dist/${CMAKE_SYSTEM_NAME}
    OPTIONAL
)

file(REMOVE ${CMAKE_CURRENT_SOURCE_DIR}/dist/${CMAKE_SYSTEM_NAME}/cblite-js.lib)
