
get_hostname() {
    echo "$1" | sed -e 's/.*\/\///g' -e 's/:/_/g' -e 's/\/.*$//'
}

do_curl () {
    url=${1:-}
    out=${2:-}
    expected=${3:-}
    run=${4:-test}
    TMPFILE=$(mktemp -t sandbox_test.XXXXXXX) || exit 1
    OUTFILE=$(mktemp -t sandbox_test.out.XXXXXXX) || exit 1
    if curl -sL -w "%{http_code}\\t%{time_total}\\t%{speed_download}\\t%{size_download}\\t%{url_effective}\\n" "$url" -o "$OUTFILE" > "$TMPFILE" 2>&1; then
        if ! grep -q '^200' "$TMPFILE" > /dev/null; then
            echo "Test failed: $out: did not receive '200' status: $url" >> "$OUTFILE" 
        fi
        if ! grep -Fq "$expected" "$OUTFILE" ; then
            echo "Test failed: $out: $url" >> "$TMPFILE"
            echo "Expected: $expected" >> "$TMPFILE"
        fi
    else
        echo "Curl failed with exit code $?: $out: $url" >> "$TMPFILE"
    fi
    cat "$TMPFILE" | tee "$out-$run.json"
    rm -f "$TMPFILE" "$OUTFILE"
}
