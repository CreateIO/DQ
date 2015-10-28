#!/bin/bash
#
# doc_load_test.sh
#
# syntax:
#     ./doc_load_test.sh [proto]://[hostname[:port]] [concurrent-requests]
#
#
# example:
#   ./test/doc_load_test.sh
#   ./test/doc_load_test.sh http://127.0.0.1:3000
#   ./test/doc_load_test.sh http://127.0.0.1:3000 30
#   ./test/doc_load_test.sh https://dq-test.create.io
#
# Defaults to http://localhost:3000 and 20 concurrent requests

# Use unofficial bash strict mode: http://redsymbol.net/articles/unofficial-bash-strict-mode/
set -eou pipefail
IFS=$'\n\t'
# Credit to Stack Overflow user Dave Dopson http://stackoverflow.com/a/246128/424301
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
. "$DIR/common.sh"

dq_host=${1:-localhost:3000}
concurrent=${2:-20}

show_header() {
    printf "code\\ttotal_s\\tdl_speed\\tdl_size\\turl_effective\\n"
}

cd "${DIR}"
svrname=$(get_hostname "${dq_host}")
url="${dq_host}/DQ/docCollection?propertyIdBin\[\]=155198&propertyIdBin\[\]=5473&version=1.0.0&type=jpg&regionID=US11001"
expected='[{"id":1295,"property_id":"155198","assets":"2207_4th_Street","fileNames":[],"status":"success","count":0},{"id":346,"property_id":"5473","assets":"1010_Massachusetts_Avenue","fileNames":[],"status":"success","count":0}]'
#url="${dq_host}/DQ/docURL?propertyID=102613&version=1.0.0"
#expected='[{"id":1449,"assets":"Spring_Valley","fileNames":[],"status":"success","count":0}]'
result="curl_result.txt"
logdir="$DIR/target/$svrname"
mkdir -p "$logdir"
cd "$logdir"

rm -f "$result"
errorlog="$logdir/errors.txt"
cat /dev/null > "$errorlog"
(
    show_header
    for run in $(seq 1 "$concurrent"); do
        (do_curl "$url" test_dataCollection "$expected" "$run" "$errorlog") &
    done
) | tee -a "$result"
exit "$(count_test_failures)"
