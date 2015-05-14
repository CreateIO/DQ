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

trex_host=${1:-localhost:8080}

show_header() {
    printf "code\\ttotal_s\\tdl_speed\\tdl_size\\turl_effective\\n"
}
do_curl () {
    curl -sL -w "%{http_code}\\t%{time_total}\\t%{speed_download}\\t%{size_download}\\t%{url_effective}\\n" "$1" -o "$2"
}

mkdir -p target/test
cd target/test
show_header

do_curl "http://${trex_host}/version" test_version.js

do_curl "http://${trex_host}/properties/kml?BBOX=-77.07143261485601,38.91516754658354,-77.06798901513987,38.91654235728794"  test_properties.kml
do_curl "http://${trex_host}/properties/czml?BBOX=-77.07143261485601,38.91516754658354,-77.06798901513987,38.91654235728794"  test_properties.czml
do_curl "http://${trex_host}/properties/json?BBOX=-77.07143261485601,38.91516754658354,-77.06798901513987,38.91654235728794"  test_properties.json
do_curl "http://${trex_host}/properties/geojson?BBOX=-77.07143261485601,38.91516754658354,-77.06798901513987,38.91654235728794"  test_properties.geojson
do_curl "http://${trex_host}/properties/geojson?BBOX=-77.0048233214098,38.8853159103428,-77.0048233214098,38.8853159103428"  test_properties_multiple_point.geojson
do_curl "http://${trex_host}/properties/geojson?BBOX=-77.0049233214098,38.8852159103428,-77.0047233214098,38.8854159103428"  test_properties_multiple_box.geojson


do_curl "http://${trex_host}/properties/geojson?BBOX=-77.07143261485601,38.91516754658354,-77.06798901513987,38.91654235728794&lotSize=GE%201350%20&%20lotSize=LE%201399"  test_properties_filter.geojson

#java.lang.NumberFormatException: For input string: "1500,LE"
# this should fail always
#do_curl "http://${trex_host}/properties/summary?lotSize=GE%201350%20&%20lotSize=LE%201500&lotSize=GE%201350%20&%20lotSize=LE%201500"  test_properties_filter_2.geojson
do_curl "http://${trex_host}/property?x=-77.06883995218747&y=38.91567415971246"  test_property_xy.json
do_curl "http://${trex_host}/property?id=115046"  test_property_id.json




