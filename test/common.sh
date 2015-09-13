#!/bin/bash
# common.sh
# 
# Functions used by multiple tests
#

get_hostname() {
    echo "$1" | sed -e 's/.*\/\///g' -e 's/:/_/g' -e 's/\/.*$//'
}

count_test_failures() {
    errorlog=${1:-errors.txt}
    wc -l "$errorlog" |  sed -e 's/^ *//' | cut -d' ' -f 1
} 

do_curl () {
    url=${1:-}
    out=${2:-}
    expected=${3:-}
    run=${4:-test}
    errorlog=${5:-errors.txt}
    connect_timeout=${6:-30}
    max_time=${7:-60}
    outputfmt="%{http_code}\\t%{time_total}\\t%{speed_download}\\t%{size_download}\\t%{url_effective}\\n"
    outputfmt="%{http_code}\\t%{time_total}\\t%{speed_download}\\t%{size_download}\\t%{url_effective}\\n"
    TMPFILE=$(mktemp -t sandbox_test.XXXXXXX) || exit 1
    OUTFILE=$(mktemp -t sandbox_test.out.XXXXXXX) || exit 1
    if curl -sL -w "$outputfmt" "$url" -o "$OUTFILE" \
        --connect-timeout "$connect_timeout" --max-time "$max_time" \
        > "$TMPFILE" 2>&1; then
        if ! grep -q '^200' "$TMPFILE" > /dev/null; then
            err="Test failed: $out: did not receive '200' status: $url"
            echo "$err" >> "$TMPFILE"
            echo "$err" >> "$errorlog"
        fi
        if ! grep -Fq "$expected" "$OUTFILE" ; then
            err="Test failed: $out Expected: $expected"
            echo "$err" >> "$TMPFILE"
            echo "$err" >> "$errorlog"
        fi
    else
        err="Curl failed with exit code $?: $out: $url"
        echo "$err" >> "$TMPFILE"
        echo "$err" >> "$errorlog"
    fi
    cp "$OUTFILE" "$out-$run.json"
    cat "$TMPFILE"
    rm -f "$TMPFILE" "$OUTFILE"
}
