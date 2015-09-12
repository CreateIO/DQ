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

do_curl "${dq_proto}://${dq_host}/DQ/datasource?source_name=airRights&regionID=US11001" test_datasource.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq '[{"source":"OCTO","id":897,"field_name":["airRights","property.airRights","core.airRights"]' test_datasource.json); then
    echo "Test failed: test_datasource.json"
fi

do_curl "${dq_proto}://${dq_host}/DQ/datasource?source_name=airRights&regionID=US11001" test_datasource.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq '[{"source":"OCTO","id":897,"field_name":["airRights","property.airRights","core.airRights"]' test_datasource.json); then
    echo "Test failed: test_datasource.json"
fi
do_curl "${dq_proto}://${dq_host}/DQ/datasource?source_name=airRights&regionID=US11001" test_datasource.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq '[{"source":"OCTO","id":897,"field_name":["airRights","property.airRights","core.airRights"]' test_datasource.json); then
    echo "Test failed: test_datasource.json"
fi
do_curl "${dq_proto}://${dq_host}/DQ/datasource?source_name=airRights&regionID=US11001" test_datasource.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq '[{"source":"OCTO","id":897,"field_name":["airRights","property.airRights","core.airRights"]' test_datasource.json); then
    echo "Test failed: test_datasource.json"
fi
do_curl "${dq_proto}://${dq_host}/DQ/datasource?source_name=airRights&regionID=US11001" test_datasource.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq '[{"source":"OCTO","id":897,"field_name":["airRights","property.airRights","core.airRights"]' test_datasource.json); then
    echo "Test failed: test_datasource.json"
fi
do_curl "${dq_proto}://${dq_host}/DQ/datasource?source_name=airRights&regionID=US11001" test_datasource.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq '[{"source":"OCTO","id":897,"field_name":["airRights","property.airRights","core.airRights"]' test_datasource.json); then
    echo "Test failed: test_datasource.json"
fi
do_curl "${dq_proto}://${dq_host}/DQ/datasource?source_name=airRights&regionID=US11001" test_datasource.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq '[{"source":"OCTO","id":897,"field_name":["airRights","property.airRights","core.airRights"]' test_datasource.json); then
    echo "Test failed: test_datasource.json"
fi
do_curl "${dq_proto}://${dq_host}/DQ/datasource?source_name=airRights&regionID=US11001" test_datasource.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq '[{"source":"OCTO","id":897,"field_name":["airRights","property.airRights","core.airRights"]' test_datasource.json); then
    echo "Test failed: test_datasource.json"
fi
do_curl "${dq_proto}://${dq_host}/DQ/datasource?source_name=airRights&regionID=US11001" test_datasource.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq '[{"source":"OCTO","id":897,"field_name":["airRights","property.airRights","core.airRights"]' test_datasource.json); then
    echo "Test failed: test_datasource.json"
fi
do_curl "${dq_proto}://${dq_host}/DQ/datasource?source_name=airRights&regionID=US11001" test_datasource.json | tee curl_result.txt
if !(grep -q '^200' curl_result.txt); then
    echo "Test failed: did not receive '200' status"
fi
if !(grep -Fq '[{"source":"OCTO","id":897,"field_name":["airRights","property.airRights","core.airRights"]' test_datasource.json); then
    echo "Test failed: test_datasource.json"
fi
