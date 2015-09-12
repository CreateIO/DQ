#!/bin/bash
#
# sandbox_tests.sh
#
# syntax:
#     ./sandbox_tests.sh [hostname[:port]]
#
#
# example:
#   ./test/sandbox_tests.sh dq-test.create.io https
#   ./test/sandbox_tests.sh localhost
#   ./tests/andbox_tests.sh 
#
# Defaults to localhost:3000
# Use unofficial bash strict mode: http://redsymbol.net/articles/unofficial-bash-strict-mode/
set -eou pipefail
IFS=$'\n\t'

dq_host=${1:-localhost:3000}
dq_proto=${2:-http}
concurrent=${3:-10}

get_hostname() {
    echo "$1" | sed -e 's/:/_/g' -e 's/\/.*$//'
}

show_header() {
    printf "code\\ttotal_s\\tdl_speed\\tdl_size\\turl_effective\\n"
}
do_curl () {
    TMPFILE=$(mktemp -t sandbox_test.XXXXXXX) || exit 1
    OUTFILE=$(mktemp -t sandbox_test.out.XXXXXXX) || exit 1
    if curl -sL -w "%{http_code}\\t%{time_total}\\t%{speed_download}\\t%{size_download}\\t%{url_effective}\\n" "$1" -o "$2" > "$TMPFILE" 2>&1; then
        if ! grep -q '^200' "$TMPFILE" > /dev/null; then
            echo "Test failed: did not receive '200' status" >> "$OUTFILE" 
        fi
        if ! grep -Fq "$3" "$TMPFILE" ; then
            echo "Test failed: test_datasource.json" >> "$OUTFILE"
        fi
    else
        echo "Curl failed with exit code $?" >> "$OUTFILE"
    fi
    cat "$TMPFILE" "$OUTFILE"
}


# Credit to Stack Overflow user Dave Dopson http://stackoverflow.com/a/246128/424301
bindir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd ${bindir}
svrname=`get_hostname ${dq_host}`
url="${dq_proto}://${dq_host}/DQ/datasource?source_name=airRights&regionID=US11001"
expected="${dq_proto}://${dq_host}/DQ/datasource?source_name=airRights&regionID=US11001"
result="curl_result.txt"
mkdir -p test/target/${svrname}
cd test/target/${svrname}

rm -f "$result"
(
    show_header
    for run in $(seq 1 "$concurrent"); do
        (do_curl "$url" test_datasource.json "$expected") &
    done
) | tee -a "$result"
