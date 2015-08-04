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

get_hostname() {
    echo "$1" | sed -e 's/:/_/g' -e 's/\/.*$//'
}

show_header() {
    printf "code\\ttotal_s\\tdl_speed\\tdl_size\\turl_effective\\n"
}
do_curl () {
    curl -sL -w "%{http_code}\\t%{time_total}\\t%{speed_download}\\t%{size_download}\\t%{url_effective}\\n" "$1" -o "$2"
}


bindir=`dirname $0`
cd ${bindir}
svrname=`get_hostname ${dq_host}`
mkdir -p test/target/${svrname}
cd test/target/${svrname}
show_header

# we skip these basic root test -- they aren't hooked up
#do_curl "${dq_proto}://${dq_host}/version" test_version.js
#do_curl "${dq_proto}://${dq_host}/DQ" test_root.json
#do_curl "${dq_proto}://${dq_host}/DQ/" test_root_dir.json
#do_curl "${dq_proto}://${dq_host}/DQ/template" test_template_generic.json

do_curl "${dq_proto}://${dq_host}/DQ/template?resource=tabs-" test_tabs_generic_novers.json
do_curl "${dq_proto}://${dq_host}/DQ/template?resource=tabs-&version=1.0.0" test_tabs_generic.json
do_curl "${dq_proto}://${dq_host}/DQ/template?resource=tabs-&version=1.0.0&branch=master&passphrase=test-Access*98765!" test_tabs_branch.json

do_curl "${dq_proto}://${dq_host}/DQ/clearCache?&branch=master&passphrase=test-Access*98765!" test_clear_cache.json

do_curl "${dq_proto}://${dq_host}/DQ/docURL/?version=1.0.0" test_docurl_generic.json

do_curl "${dq_proto}://${dq_host}/DQ/docURL?propertyID=102613&version=1.0.0" test_docurl_single.json

do_curl "${dq_proto}://${dq_host}/DQ/docCollection?propertyIdBin=153058&propertyIdBin=5473&version=1.0.0&type=pdf" test_doccollection.json

do_curl "${dq_proto}://${dq_host}/DQ/docURL?propertyID=131292&version=1.0.0" test_docurl_double.json

do_curl "${dq_proto}://${dq_host}/DQ/docURL?parcelID=3434&version=1.0.0" test_docurl_single_parcelid.json

do_curl "${dq_proto}://${dq_host}/DQ/regionAsset?region=US11001&resource=fredRecessionDates" test_regionasset.json

do_curl "${dq_proto}://${dq_host}/DQ/nearbyregions?regionID=US11001" test_nearbyRegions.json

do_curl "${dq_proto}://${dq_host}/DQ/region?lat=38.9041485&long=-77.017094" test_fetchRegion.json

do_curl "${dq_proto}://${dq_host}/DQ/regiondata?regionID=US11001" test_regiondata.json

do_curl "${dq_proto}://${dq_host}/DQ/version" test_fetchversion.json

do_curl "${dq_proto}://${dq_host}/DQ/datasource?fieldName=airRights&regionID=US11001" test_datasource.json

