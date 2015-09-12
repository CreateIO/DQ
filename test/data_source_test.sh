#!/bin/bash
#
# data_source_test.sh
#
# syntax:
#     ./data_source_test.sh [hostname[:port]]
#
#
# example:
#   ./test/data_source_test.sh https://dq-test.create.io
#   ./test/data_source_test.sh localhost
#   ./tests/andbox_tests.sh 
#
# Defaults to localhost:3000

# Use unofficial bash strict mode: http://redsymbol.net/articles/unofficial-bash-strict-mode/
set -eou pipefail
IFS=$'\n\t'
# Credit to Stack Overflow user Dave Dopson http://stackoverflow.com/a/246128/424301
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

get_hostname() {
    echo "$1" | sed -e 's/.*\/\//g' -e 's/:/_/g' -e 's/\/.*$//'
}

dq_host=${1:-http://127.0.0.1:3000}
concurrency=${2:-5}  # simultaneous users
duration=${3:-10}     # in seconds

baseurl="${dq_host}/DQ/datasource"
svrname=$(get_hostname "$dq_host")

mkdir -p "$DIR/test/target/${svrname}"
cd "$DIR/test/target/${svrname}"

url="${baseurl}?region=US11001&source_name=property.numUnits"
#url="${baseurl}?source_name=airRights&regionID=US11001"
echo "testing $url"
#curl -v "$url"
ab -c "$concurrency" -t "$duration" "$url" | tee "ab-$concurrency-$duration.txt"
