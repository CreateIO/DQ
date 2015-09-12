#!/bin/bash
# Credit to Stack Overflow user Dave Dopson http://stackoverflow.com/a/246128/424301
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Source common script that has BASEDIR + run_if_updated
source scripts/common.sh

# Make sure we have node and brew
install_prerequisites
# run npm install if package.json has been updated
run_if_updated package.json npm install 

