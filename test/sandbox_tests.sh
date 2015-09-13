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
#do_curl "${dq_proto}://${dq_host}/DQ" test_root.json
#do_curl "${dq_proto}://${dq_host}/DQ/" test_root_dir.json

do_curl "${dq_proto}://${dq_host}/DQ/template?resource=tabs-" test_tabs_generic_novers.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq '{"tabs":[{"name":"Property","tabs":[{"name":"Overview",' test_tabs_generic_novers.json); then
    echo "Test failed: test_tabs_generic_novers.json"
fi

do_curl "${dq_proto}://${dq_host}/DQ/template?resource=tabs-&version=1.0.0" test_tabs_generic.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq '{"tabs":[{"name":"Property","tabs":[{"name":"Overview",' test_tabs_generic.json); then
    echo "Test failed: test_tabs_generic.json"
fi

do_curl "${dq_proto}://${dq_host}/DQ/template?resource=tabs-&version=1.0.0&branch=master" test_tabs_branch.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq '{"tabs":[{"name":"Property","tabs":[{"name":"Overview",' test_tabs_branch.json); then
    echo "Test failed: test_tabs_branch.json"
fi

do_curl "${dq_proto}://${dq_host}/DQ/clearCache?&branch=master&passphrase=test-Access*98765!" test_clear_cache.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq 'Branch ../DQMatchSetsLocal/master cleared' test_clear_cache.json); then
    echo "Test failed: test_clear_cache.json"
fi

do_curl "${dq_proto}://${dq_host}/DQ/docURL/?version=1.0.0" test_docurl_generic.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq '[{"fileNames":[],"status":"success","count":0}]' test_docurl_generic.json); then
    echo "Test failed: test_docurl_generic.json"
fi

do_curl "${dq_proto}://${dq_host}/DQ/docURL?propertyID=102613&version=1.0.0" test_docurl_single.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq '[{"id":1449,"assets":"Spring_Valley","fileNames":[],"status":"success","count":0}]' test_docurl_single.json); then
    echo "Test failed: test_docurl_single.json"
fi

do_curl "${dq_proto}://${dq_host}/DQ/docCollection?propertyIdBin=153058&propertyIdBin=5473&version=1.0.0&type=pdf" test_doccollection.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq '[{"id":346,"property_id":"5473","assets":"1010_Massachusetts_Avenue","fileNames":[],"status":"success","count":0}]' test_doccollection.json); then
    echo "Test failed: test_doccollection.json"
fi

do_curl "${dq_proto}://${dq_host}/DQ/docURL?propertyID=131292&version=1.0.0" test_docurl_double.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq '[{"id":1482,"assets":"3365_14th_Street","fileNames":[],"status":"success","count":0},{"id":47,' test_docurl_double.json); then
    echo "Test failed: test_docurl_double.json"
fi

do_curl "${dq_proto}://${dq_host}/DQ/docURL?parcelID=3434&version=1.0.0" test_docurl_single_parcelid.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq '[{"fileNames":[],"status":"success","count":0}]' test_docurl_single_parcelid.json); then
    echo "Test failed: test_docurl_single_parcelid.json"
fi

do_curl "${dq_proto}://${dq_host}/DQ/regionAsset?region=US11001&resource=fredRecessionDates" test_regionasset.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq '[{"name":"polygon 1","points":[{"date":"8/1/1929","y":0},{"date":"8/1/1929","y":1},' test_regionasset.json); then
    echo "Test failed: test_regionasset.json"
fi

do_curl "${dq_proto}://${dq_host}/DQ/regionAsset?region=US11001_50000&resource=fredRecessionDates" test_regionasset3.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq '[{"name":"polygon 1","points":[{"date":"8/1/1929","y":0},{"date":' test_regionasset3.json); then
    echo "Test failed: test_regionasset3.json"
fi

do_curl "${dq_proto}://${dq_host}/DQ/nearbyregions?regionID=US11001" test_nearbyRegions.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq '[{"region_id":"US24033","region_full_name":"Prince George' test_nearbyRegions.json); then
    echo "Test failed: test_nearbyRegions.json"
fi

do_curl "${dq_proto}://${dq_host}/DQ/region?lat=38.9041485&long=-77.017094" test_fetchRegion.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq '[{"region_id":"US11","region_full_name":"District of Columbia, US","region_level":1},{"region_id":"US",' test_fetchRegion.json); then
    echo "Test failed: test_fetchRegion.json"
fi

do_curl "${dq_proto}://${dq_host}/DQ/regiondata?regionID=US11001" test_regiondata.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq '[{"region_level":2,"region_typename":null,"region_child_typename":"","region_full_name":"Washington, DC, US"' test_regiondata.json); then
    echo "Test failed: test_regiondata.json"
fi

do_curl "${dq_proto}://${dq_host}/DQ/version" test_fetchversion.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq 'DB_HOST":"dq-test.cvwdsktow3o7.us-east-1.rds.amazonaws.com","S3_ASSET_BUCKET":"create.assets","S3_ASSET' test_fetchversion.json); then
    echo "Test failed: test_fetchversion.json"
fi

do_curl "${dq_proto}://${dq_host}/DQ/datasource?source_name=airRights&regionID=US11001" test_datasource.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq '[{"source":"OCTO","id":897,"field_name":["airRights","property.airRights","core.airRights"]' test_datasource.json); then
    echo "Test failed: test_datasource.json"
fi

do_curl "${dq_proto}://${dq_host}/DQ/regionFind?nameState=California&nameCity=Glendale" test_regionname.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq '[{"region_id":"US06037_30000","region_full_name":"Glendale, CA","region_level":3}]' test_regionname.json); then
    echo "Test failed: test_regionname.json"
fi

do_curl "${dq_proto}://${dq_host}/DQ/regionFind?name=Washington" test_regionname2.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq '{"region_id":"US39167","region_full_name":"Washington County, OH, US","region_level":2}' test_regionname2.json); then
    echo "Test failed: test_regionname2.json"
fi
