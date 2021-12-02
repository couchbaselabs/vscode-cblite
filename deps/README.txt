So far this has only been tested on Linux:

Extract the downloadable package into this folder and move everything out of the top level folder (e.g. mv libcblite-3.0.0/* .)

Until the C++ headers are shipped with the product, copy them into the deps/include directory (all of include/cbl++ and Fleece.hh, Mutable.hh, and slice.hh from Fleece).