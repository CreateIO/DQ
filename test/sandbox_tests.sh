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

    # template tests -- test "normal, branching, merging, regions, groupdata"
    # grab the tabs from dq-sandbox-test branch to guarantee we have something to clear (so don't get error on clear test)
    do_curl "${dq_host}/DQ/template?resource=tabs-&branch=dq-sandbox-test" \
        tabs_generic_novers \
        '{"tabs":[{"id":"navProperty","name":"Property","tabs":[{"id":"navOverview","name":"Overview",'

    # next, clear cache of test branch so must always refetch from that repo
    do_curl "${dq_host}/DQ/clearCache?&branch=dq-sandbox-test&passphrase=test-Access*98765!" \
        clear_cache \
        'Branch ../DQMatchSetsLocal/dq-sandbox-test cleared'

    # Note: we run tests twice in some cases to check different code since first time pulls from github, second time from locacl cache
    do_curl "${dq_host}/DQ/template?resource=tabs-&branch=master" \
        tabs_generic_novers \
        '{"tabs":[{"id":"navProperty","name":"Property","tabs":[{"id":"navOverview","name":"Overview",'

    do_curl "${dq_host}/DQ/template?resource=tabs-&version=1.0.0&branch=dq-sandbox-test" \
        tabs_branch \
        '{"tabs":[{"id":"navProperty","name":"Property","tabs":[{"id":"navOverview","name":"Overview",'

    do_curl "${dq_host}/DQ/template?resource=histDist&region=US11001&branch=dq-sandbox-test" \
        template_full \
        '{"histDist":[{"objectID":6,"layerGroup":"Corridor","name":'

    do_curl "${dq_host}/DQ/template?resource=market&region=MD_DC&branch=dq-sandbox-test" \
        md_cache \
        '{"name":"DC","abbreviation":"DC","regionTags":[{"name":"District of Columbia","tag":"US11001"}]}'

    do_curl "${dq_host}/DQ/template?resource=market&region=MD_Baltimore&branch=dq-sandbox-test" \
        md_cachehalf \
        '{"name":"Baltimore","regionTags":[{"name":"City of Baltimore","tag":"US24510"}]}'

    do_curl "${dq_host}/DQ/template?resource=histDist&region=US11001&branch=dq-sandbox-test" \
        template_full2 \
        '{"histDist":[{"objectID":6,"layerGroup":"Corridor","name":'

    do_curl "${dq_host}/DQ/template?resource=merge_test_1&region=US11001&branch=dq-sandbox-test" \
        template_merge \
        '{"bool":"false","value":11001,"a":[{"letter":"i","text":"something"},{"letter":"f","text":"wicked"},{"letter":"y","text":"this"},{"letter":"a","text":"Is The Same"}],"s":"endify"}'

    do_curl "${dq_host}/DQ/template?resource=merge_test_1&region=US11001&branch=dq-sandbox-test" \
        template_merge2 \
        '{"bool":"false","value":11001,"a":[{"letter":"i","text":"something"},{"letter":"f","text":"wicked"},{"letter":"y","text":"this"},{"letter":"a","text":"Is The Same"}],"s":"endify"}'

    do_curl "${dq_host}/DQ/groupdata?groupBin=22&groupBin=23&branch=dq-sandbox-test" \
        group_merge \
        '{"bool":"false","value":11001,"a":[{"letter":"e","text":"must"},{"letter":"n","text":"see"},{"letter":"d","text":"this"},{"letter":"a","text":"Is The Same"},{"letter":"i","text":"something"},{"letter":"f","text":"wicked"},{"letter":"y","text":"this"},{"letter":"a","text":"Is The Same"}],"s":"endify"}'

    do_curl "${dq_host}/DQ/groupdata?groupBin=22&groupBin=23&branch=dq-sandbox-test" \
        group_merge2 \
        '{"bool":"false","value":11001,"a":[{"letter":"e","text":"must"},{"letter":"n","text":"see"},{"letter":"d","text":"this"},{"letter":"a","text":"Is The Same"},{"letter":"i","text":"something"},{"letter":"f","text":"wicked"},{"letter":"y","text":"this"},{"letter":"a","text":"Is The Same"}],"s":"endify"}'

    do_curl "${dq_host}/DQ/groupdata?groupBin=151&groupBin=4&branch=dq-sandbox-test" \
        groupdata1 \
        '{"allTheLayers":{"gsa":{"id":47,"displayName":"gsa","mouseoverName":"GSA Leases",'

    # do a second time, and check for a different potential issue as well
    do_curl "${dq_host}/DQ/groupdata?groupBin=151&groupBin=4&branch=dq-sandbox-test" \
        groupdata2 \
        '"id":7,"name":"Neighborhood","type":"lookup","category":"Property","subcategory":"Property","output":"zillowNbhdName=IN'

    # template tests -- test clearing of cache
    do_curl "${dq_host}/DQ/clearCache?&branch=master&passphrase=test-Access*98765!" \
         clear_cache \
        'Branch ../DQMatchSetsLocal/master cleared'

    # asset tests -- test docCollection, docURL
    do_curl "${dq_host}/DQ/docURL/?version=1.0.0" \
        docurl_generic \
        '[{"fileNames":[],"status":"success","count":0}]'

    do_curl "${dq_host}/DQ/docCollection?propertyIdBin=5511&propertyIdBin=2&version=1.0.0&type=pdf" \
        docurl_single \
        '[{"id":620,"property_id":"5511","assets":"1001_Pennsylvania_Avenue","fileNames":["regional_assets/country/US/state/US11/county/US11001/imagesets-/1001_Pennsylvania_Avenue/1001PennsylvaniaAvenue_millerwlker_15.pdf",'

    do_curl "${dq_host}/DQ/docCollection?propertyIdBin=153058&propertyIdBin=5473&version=1.0.0&type=pdf" \
        doccollection \
        '[{"id":346,"property_id":"5473","assets":"1010_Massachusetts_Avenue","fileNames":["regional_assets/country/US/state/US11/county/US11001/imagesets-/1010_Massachusetts_Avenue/1010_mass_ave_nw_millerwalker_04_13.pdf'

    do_curl "${dq_host}/DQ/docURL?version=1.0.0&region=US11001&type=jpg&propertyID=5511" \
        docurl_double \
        '[{"id":620,"assets":"1001_Pennsylvania_Avenue","fileNames":["regional_assets/country/US/state/US11/county/US11001/imagesets-/1001_Pennsylvania_Avenue/1001PennAveNW.jpg",'

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
        '[{"region_id":"US11001","region_full_name":"Washington, DC, US","region_level":2},{"region_id":"US11","region_full_name":"District of Columbia,'

    do_curl "${dq_host}/DQ/regiondata?regionID=US11001" \
        regiondata \
        '[{"region_level":2,"region_typename":null,"region_child_typename":"","region_full_name":"Washington, DC, US"'

    do_curl "${dq_host}/DQ/version" \
        fetchversion \
        '.cvwdsktow3o7.us-east-1.rds.amazonaws.com","S3_ASSET_BUCKET":"create.assets","S3_ASSET'

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

    # test results from property search count scraper
    do_curl "${dq_host}/DQ/propCount?regionID=US11001&top=5" \
        pcount1 \
        '"address":"20019,WASHINGTON, 3423 - 3439 BENNING RD NE","lat":-76.956205987,"long":38.8960303924},{"select_count":'

    do_curl "${dq_host}/DQ/propCount?regionID=US11001&range=3&top=5" \
        pcount2 \
       '"address":"20019,WASHINGTON, 3423 - 3439 BENNING RD NE","lat":-76.956205987,"long":38.8960303924},{"select_count"'

    do_curl "${dq_host}/DQ/propCount?regionID=US11001&top=5&range=3&envelope=-77.0&envelope=38.899471994&envelope=-76.9873458022&envelope=38.95" \
        pcount3 \
        '"address":"20002,WASHINGTON, 701 H ST NE","lat":-76.9959870112,"long":38.8999314961},{"select_count":'

    # test stats for specific month/year
    do_curl "${dq_host}/DQ/stats?month=3&year=2016&start=0&rows=5" \
        userstats \
        '"coverage_month":3,"coverage_year":2016,"total_time":'

    do_curl "${dq_host}/DQ/stats?month=3&year=2016&start=0&rows=5&format=csv" \
        userstats_csv \
        'stat_id,user_id,coverage_month,coverage_year,total_time,max_time,last_visit_date,first_visit_date,total_actions,max_actions,total_searches,max_searches,visit_count'

) | tee sandbox_tests.txt
exit "$(count_test_failures)"
