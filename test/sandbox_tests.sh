#!/bin/bash
#
# sandbox_tests.sh
#
# syntax:
#     ./sandbox_tests.sh  [<proto>://<hostname[:port]>] 
#
# example:
#   ./test/sandbox_tests.sh https://dq-test.create.io
#   ./test/sandbox_tests.sh http://localhost:3000
#   ./test/sandbox_tests.sh 
#
# Defaults to http://localhost:3000

# Use unofficial bash strict mode: http://redsymbol.net/articles/unofficial-bash-strict-mode/
set -eou pipefail
IFS=$'\n\t'
# Credit to Stack Overflow user Dave Dopson http://stackoverflow.com/a/246128/424301
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
. "$DIR/common.sh"
cd "$DIR"

dq_host=${1:-http://localhost:3000}

show_header() {
    printf "code\\ttotal_s\\tdl_speed\\tdl_size\\turl_effective\\n"
}

svrname=$(get_hostname "$dq_host")
testdir="$DIR/target/$svrname"
errorlog="$testdir/errors.txt"
mkdir -p "$testdir"
cd "$testdir"
cat /dev/null > "$errorlog"

(
    show_header

    # we skip these basic root test -- they aren't hooked up
    #do_curl "${dq_host}/DQ" root
    #do_curl "${dq_host}/DQ/" root_dir

    do_curl "${dq_host}/DQ/template?resource=tabs-&branch=master" \
        tabs_generic_novers \
        '{"tabs":[{"id":"navProperty","name":"Property","tabs":[{"id":"navOverview","name":"Overview",'

    do_curl "${dq_host}/DQ/template?resource=tabs-&version=1.0.0&branch=master" \
        tabs_generic \
    '{"tabs":[{"id":"navProperty","name":"Property","tabs":[{"id":"navOverview","name":"Overview",'

    do_curl "${dq_host}/DQ/template?resource=tabs-&version=1.0.0&branch=test" \
        tabs_branch \
        '{"tabs":[{"id":"navProperty","name":"Property","tabs":[{"id":"navOverview","name":"Overview",'

    do_curl "${dq_host}/DQ/clearCache?&branch=master&passphrase=test-Access*98765!" \
         clear_cache \
        'Branch ../DQMatchSetsLocal/master cleared'

    do_curl "${dq_host}/DQ/docURL/?version=1.0.0" \
        docurl_generic \
        '[{"fileNames":[],"status":"success","count":0}]'

    do_curl "${dq_host}/DQ/docURL?propertyID=102613&version=1.0.0" \
        docurl_single \
        '[{"id":1449,"assets":"Spring_Valley","fileNames":[],"status":"success","count":0}]'

    do_curl "${dq_host}/DQ/docCollection?propertyIdBin=153058&propertyIdBin=5473&version=1.0.0&type=pdf" \
        doccollection \
        '[{"id":346,"property_id":"5473","assets":"1010_Massachusetts_Avenue","fileNames":[],"status":"success","count":0}]'

    do_curl "${dq_host}/DQ/docURL?propertyID=131292&version=1.0.0" \
        docurl_double \
        '[{"id":1482,"assets":"3365_14th_Street","fileNames":[],"status":"success","count":0},{"id":47,'

    do_curl "${dq_host}/DQ/docURL?parcelID=3434&version=1.0.0" \
        docurl_single_parcelid \
        '[{"fileNames":[],"status":"success","count":0}]'

    do_curl "${dq_host}/DQ/regionAsset?region=US11001&resource=fredRecessionDates" \
        regionasset \
        '[{"name":"polygon 1","points":[{"date":"8/1/1929","y":0},{"date":"8/1/1929","y":1},'

    do_curl "${dq_host}/DQ/regionAsset?region=US11001_50000&resource=fredRecessionDates" \
        regionasset3 \
        '[{"name":"polygon 1","points":[{"date":"8/1/1929","y":0},{"date":'

    do_curl "${dq_host}/DQ/nearbyregions?regionID=US11001" \
        nearbyRegions \
        '[{"region_id":"US24033","region_full_name":"Prince George'

    do_curl "${dq_host}/DQ/region?lat=38.9041485&long=-77.017094" \
        fetchRegion \
        '[{"region_id":"US11","region_full_name":"District of Columbia, US","region_level":1},{"region_id":"US",'

    do_curl "${dq_host}/DQ/regiondata?regionID=US11001" \
        regiondata \
        '[{"region_level":2,"region_typename":null,"region_child_typename":"","region_full_name":"Washington, DC, US"'

    do_curl "${dq_host}/DQ/version" \
        fetchversion \
        'DB_HOST":"dq-test.cvwdsktow3o7.us-east-1.rds.amazonaws.com","S3_ASSET_BUCKET":"create.assets","S3_ASSET'

    do_curl "${dq_host}/DQ/analysisData?regionID=US11001&neighborhood=Adams%20Morgan" \
        fetchAnalysis \
        '[{"bkt_sale":"0-250K","fin_land_old_land_value":'

    do_curl "${dq_host}/DQ/datasource?source_name=airRights&regionID=US11001" \
        datasource \
        ',"field_name":["airRights","property.airRights","core.airRights"]'

    do_curl "${dq_host}/DQ/regionFind?nameState=California&nameCity=Glendale" \
        regionname \
        '[{"region_id":"US06037_30000","region_full_name":"Glendale, CA","region_level":3}]'

    do_curl "${dq_host}/DQ/regionFind?name=Washington" \
        regionname2 \
        '{"region_id":"US39167","region_full_name":"Washington County, OH, US","region_level":2}'
) | tee sandbox_tests.txt
exit "$(count_test_failures)"
