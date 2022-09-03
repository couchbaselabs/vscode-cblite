project(cblite-js)
cmake_minimum_required(VERSION 3.10)
set (CMAKE_CXX_STANDARD 17)
set (CMAKE_C_STANDARD 11)

if(APPLE)
    set (CMAKE_INSTALL_RPATH "@loader_path")
    set (CMAKE_OSX_ARCHITECTURES "arm64;x86_64")
else()
    set (CMAKE_INSTALL_RPATH "\$ORIGIN")
endif()

set(
    SRC_FILES
    src/native/DatabaseConfiguration.cc
    src/native/Database.cc
    src/native/Document.cc
    src/native/Query.cc
    src/native/Blob.cc
    src/native/Collection.cc
    src/native/cblite.cc
)

include_directories(${CMAKE_JS_INC})
add_library(${PROJECT_NAME} SHARED ${SRC_FILES} ${CMAKE_JS_SRC})
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")
set_property(DIRECTORY APPEND PROPERTY COMPILE_DEFINITIONS
    $<$<CONFIG:Debug>:DEBUG>
)
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
    CouchbaseLite 3.1.0 REQUIRED
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

# Note: Later when we get a portable libcblite.so, reinstate this line!
# file(GLOB_RECURSE LINUX_LIBS ${CouchbaseLite_DIR}/../../../libcblite.so*)
file(GLOB_RECURSE MAC_LIBS ${CouchbaseLite_DIR}/../../../lib/libcblite*.dylib)
install(
    FILES
    ${CouchbaseLite_DIR}/../../../bin/cblite.dll
    ${MAC_LIBS}
    #${LINUX_LIBS}
    DESTINATION ${CMAKE_CURRENT_SOURCE_DIR}/out/${CMAKE_SYSTEM_NAME}
    OPTIONAL
)

install(
    FILES
    ${CouchbaseLite_DIR}/../../../bin/cblite.dll
    ${MAC_LIBS}
    #${LINUX_LIBS}
    DESTINATION ${CMAKE_CURRENT_SOURCE_DIR}/dist
    OPTIONAL
)
