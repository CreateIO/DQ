#!/bin/bash
#
# sandbox_tests.sh
#
# syntax:
#     ./sandbox_tests.sh [hostname[:port]]
#
#
# example:
#   ./sandbox_tests.sh dq-test.create.io
#   ./sandbox_tests.sh dq.create.io
#   ./sandbox_tests.sh localhost:3000
#
# Defaults to localhost:3000
# Use unofficial bash strict mode: http://redsymbol.net/articles/unofficial-bash-strict-mode/
set -eou pipefail
IFS=$'\n\t'

dq_host=${1:-localhost:3000}
dq_proto=${2:-http}

get_hostname() {
    echo "$1" | sed -e 's/:/_/g' -e 's/\/.*$//'
}
show_header() {
    printf "code\\ttotal_s\\tdl_speed\\tdl_size\\turl_effective\\n"
}
do_curl () {
    curl -sL -w "%{http_code}\\t%{time_total}\\t%{speed_download}\\t%{size_download}\\t%{url_effective}\\n" "$1" -o "$2"
}

svrname=`get_hostname $dq_host`
bindir=`dirname "$0"`

mkdir -p "${bindir}"/target/"${svrname}"
cd "${bindir}"/target/"${svrname}"
show_header

do_curl "${dq_proto}://${dq_host}/DQ/version" test_version.js


do_curl "${dq_proto}://${dq_host}/DQ/template?resource=tabs-&version=1.0.0" test_resource_tabs.json


# invalid search
do_curl "${dq_proto}://${dq_host}/DQ/docURL?cheese_balls=135029" test_unknown_search_field.json

# valid search
do_curl "${dq_proto}://${dq_host}/DQ/docURL?property_id=1921" test_property.json

do_curl "${dq_proto}://${dq_host}/DQ/docURL?property_id=-1921" test_property_notfound.json

do_curl "${dq_proto}://${dq_host}/DQ/docURL?property_id=1921a" test_property_invalid.json

do_curl "${dq_proto}://${dq_host}/DQ/docURL?parcel_id=3434" test_parcelid.json

do_curl "${dq_proto}://${dq_host}/DQ/docURL?parcel_id=-3434" test_parcelid_notfound.json

do_curl "${dq_proto}://${dq_host}/DQ/docURL?parcel_id=3434a" test_parcelid_invalid.json

do_curl "${dq_proto}://${dq_host}/DQ/docURL?property_id=3434&type=jpg&version=1.0.0" test_by_type_version.json


