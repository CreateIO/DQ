#!/bin/bash
#
# sandbox_tests.sh
#
# syntax:
#     ./sandbox_tests.sh [hostname[:port]]
#
#
# example:
#   ./sandbox_tests.sh philly-t-rex.herokuapp.com
#   ./sandbox_tests.sh philly-t-rex-dev.herokuapp.com:80
#   ./sandbox_tests.sh philly-t-rex-demo.herokuapp.com:80
#
# Defaults to localhost:8080
# Use unofficial bash strict mode: http://redsymbol.net/articles/unofficial-bash-strict-mode/
set -eou pipefail
IFS=$'\n\t'

dq_host=${1:-localhost:3000}
dq_proto=${2:-http}

show_header() {
    printf "code\\ttotal_s\\tdl_speed\\tdl_size\\turl_effective\\n"
}
do_curl () {
    curl -sL -w "%{http_code}\\t%{time_total}\\t%{speed_download}\\t%{size_download}\\t%{url_effective}\\n" "$1" -o "$2"
}

mkdir -p target/test
cd target/test
show_header

do_curl "${dq_proto}://${dq_host}/version" test_version.js


do_curl "${dq_proto}://${dq_host}/DQ" test_root.json
do_curl "${dq_proto}://${dq_host}/DQ/" test_root_dir.json

do_curl "${dq_proto}://${dq_host}/DQ/template" test_template_generic.json
do_curl "${dq_proto}://${dq_host}/DQ/template?resource=tabs-" test_tabs_generic_novers.json
do_curl "${dq_proto}://${dq_host}/DQ/template?resource=tabs-&version=1.0.0" test_tabs_generic.json




