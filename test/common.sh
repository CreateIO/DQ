
get_hostname() {
    echo "$1" | sed -e 's/.*\/\///g' -e 's/:/_/g' -e 's/\/.*$//'
}

