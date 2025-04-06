#!/bin/bash

# Copy dot files to both CJS and ESM directories
cp -r ../dot-files dist/cjs/dot-files
cp -r ../dot-files dist/esm/dot-files
