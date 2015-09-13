#!/bin/bash
#
# data_source_test.sh
#
# syntax:
#     ./data_source_test.sh  [<proto>://<hostname[:port]>] [concurrency] [duration]
#
#
# example:
#   ./test/data_source_test.sh https://dq-test.create.io
#   ./test/data_source_test.sh http://localhost:3000 
#   ./test/data_source_test.sh http://localhost:3000 20 20
#
# Defaults to localhost:3000, 20 concurrent users, and 10 seconds

# Use unofficial bash strict mode: http://redsymbol.net/articles/unofficial-bash-strict-mode/
set -eou pipefail
IFS=$'\n\t'
# Credit to Stack Overflow user Dave Dopson http://stackoverflow.com/a/246128/424301
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
. "$DIR/common.sh"

cd "$DIR"

dq_host=${1:-http://127.0.0.1:3000}
concurrency=${2:-20}  # simultaneous users
duration=${3:-10}     # in seconds

baseurl="${dq_host}/DQ/datasource"
svrname=$(get_hostname "$dq_host")
testdir="$DIR/target/${svrname}"

mkdir -p "$testdir"
cd "$testdir"

url="${baseurl}?region=US11001&source_name=property.numUnits"
#url="${baseurl}?source_name=airRights&regionID=US11001"
echo "testing $url"
#curl -v "$url"
outfile="ab-$concurrency-$duration.txt"
ab -c "$concurrency" -t "$duration" "$url" | tee "$outfile"
grep '^Failed requests:        0$' "$outfile" > /dev/null # exit non-zero if errors
