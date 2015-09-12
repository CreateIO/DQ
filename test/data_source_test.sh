#!/bin/bash
#
# data_source_test.sh
#
# syntax:
#     ./data_source_test.sh [hostname[:port]]
#
#
# example:
#   ./test/data_source_test.sh dq-test.create.io https
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
    echo "$1" | sed -e 's/:/_/g' -e 's/\/.*$//'
}

dq_host=${1:-127.0.0.1:3000}
dq_proto=${2:-http}
concurrency=${3:-5}  # simultaneous users
duration=${4:-10}     # in seconds

baseurl="${dq_proto}://${dq_host}/DQ/datasource"
svrname=$(get_hostname "$dq_host")

mkdir -p "test/target/${svrname}"
cd "test/target/${svrname}"

url="${baseurl}?region=US11001&source_name=property.numUnits"
#url="${baseurl}?source_name=airRights&regionID=US11001"
echo "testing $url"
#curl -v "$url"
ab -c "$concurrency" -t "$duration" "$url"
