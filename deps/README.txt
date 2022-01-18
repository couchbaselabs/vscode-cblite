Extract the downloadable package into this folder and move everything out of the top level folder (e.g. mv libcblite-3.0.0/* .).  In other words you should see the following inside of the deps folder:

include/
lib/
bin/ (Windows only, contains .dll)

The CMake project will take care of downloading the C++ headers that are needed.  If this structure is not obeyed you will get a scary looking error about being unable to find Couchbase Lite libraries.
