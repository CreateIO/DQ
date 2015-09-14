#!/bin/bash
#
# source_load_test.sh
#
# syntax:
#     ./source_load_test.sh [proto]://[hostname[:port]] [concurrent-requests]
#
#
# example:
#   ./test/source_load_test.sh
#   ./test/source_load_test.sh http://127.0.0.1:3000 
#   ./test/source_load_test.sh http://127.0.0.1:3000 30
#   ./test/source_load_test.sh https://dq-test.create.io
#
# Defaults to localhost:3000 and 10 concurrent requests

# Use unofficial bash strict mode: http://redsymbol.net/articles/unofficial-bash-strict-mode/
set -eou pipefail
IFS=$'\n\t'
# Credit to Stack Overflow user Dave Dopson http://stackoverflow.com/a/246128/424301
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
. "$DIR/common.sh"

dq_host=${1:-localhost:3000}
concurrent=${2:-10}

show_header() {
    printf "code\\ttotal_s\\tdl_speed\\tdl_size\\turl_effective\\n"
}

do_curl () {
    url=${1:-}
    out=${2:-}
    expected=${3:-}
    run=${4:-}
    TMPFILE=$(mktemp -t sandbox_test.XXXXXXX) || exit 1
    OUTFILE=$(mktemp -t sandbox_test.out.XXXXXXX) || exit 1
    if curl -sL -w "%{http_code}\\t%{time_total}\\t%{speed_download}\\t%{size_download}\\t%{url_effective}\\n" "$url" -o "$out-$run.json" > "$TMPFILE" 2>&1; then
        if ! grep -q '^200' "$TMPFILE" > /dev/null; then
            echo "Test failed: did not receive '200' status" >> "$OUTFILE" 
        fi
        if ! grep -Fq "$expected" "$TMPFILE" ; then
            echo "Test failed: test_datasource.json" >> "$OUTFILE"
        fi
    else
        echo "Curl failed with exit code $?" >> "$OUTFILE"
    fi
    cat "$TMPFILE" "$OUTFILE"
    rm -f "$TMPFILE" "$OUTFILE"
}


cd "${DIR}"
svrname=$(get_hostname "${dq_host}")
url="${dq_host}/DQ/datasource?source_name=airRights&regionID=US11001"
expected="${dq_host}/DQ/datasource?source_name=airRights&regionID=US11001"
result="curl_result.txt"
mkdir -p "$DIR/target/$svrname"
cd "$DIR/target/$svrname"

rm -f "$result"
(
    show_header
    for run in $(seq 1 "$concurrent"); do
        (do_curl "$url" test_datasource "$expected" "$run") &
    done
) | tee -a "$result"
