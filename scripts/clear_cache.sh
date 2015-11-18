#!/bin/bash
# clear_cache.sh
# this removes ALL local cache files, thereby enabling server to recognize it needs to fetch new ones.

# Use unofficial bash strict mode
# http://redsymbol.net/articles/unofficial-bash-strict-mode/
set -euo pipefail
IFS=$'\n\t'
# Credit to Stack Overflow user Dave Dopson http://stackoverflow.com/a/246128/424301
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cache_dir="$DIR/../../DQMatchSetsLocal"
# Just in case the cache dir hasn't been created yet, create it (harmless if there)
echo 'clearing '$cache_dir
mkdir -p $cache_dir
rm -rf $cache_dir/*

