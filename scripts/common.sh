#!/bin/bash
#
# common.sh
#
# Common shell functions to make provisioning easier


# Credit to Stack Overflow user Dave Dopson http://stackoverflow.com/a/246128/424301
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BASEDIR="$DIR/.."

# can't use -u because rvm hates it :(
set -eo pipefail

assert_is_running_os() {
    os=${1:-}
    running_os=$(uname)
    if [[ "$os" != "$running_os" ]]; then
        echo "Operating system is $running_os, not $os, terminating program."
        false
    fi
}

assert_has_program() {
    prog=${1:-}
    message=${2:-}
    if ! which "$prog" > /dev/null 2>&1; then
        echo "No $message $prog detected, terminating program."
        false
    fi
}

attempt_installation () {
    name=${1:-}
    prog=${2:-}
    install_function=${3:-}
    if ! which "$prog" > /dev/null 2>&1; then
        "$install_function"
    else
        echo "$name is already installed, continuing."
    fi
}

install_postgresql() {
    brew install postgresql
    # Link and launch PostgreSQL as the installation directions state
    ln -sfv /usr/local/opt/postgresql/*.plist ~/Library/LaunchAgents
    launchctl load ~/Library/LaunchAgents/homebrew.mxcl.postgresql.plist
}

install_nodejs() {
    brew install node
}

install_homebrew () {
    ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
}

config_file_updated() {
    config="${1:-}"
    config_path="$BASEDIR/${config}"
    cache_path="$BASEDIR/.${config}.cache"
    if [ -f "$config_path" ]; then
        if [ ! -f "$cache_path" -o "$config_path" -nt "$cache_path" ]; then
            retcode=0
        else
            retcode=1
        fi
    else
        echo "Can't find config file $config_path!"
        retcode=1
    fi
    return "$retcode"
}

update_config_file_cache() {
    config="${1:-}"
    config_path="$BASEDIR/${config}"
    cache_path="$BASEDIR/.${config}.cache"
    if [ -f "$config_path" ]; then
        echo "Updating config cache file $cache_path"
        touch "$cache_path"
    else
        echo "Can't find config file $config_path!"
        return 1
    fi
}

# This is a one-liner that checks to see if a config file has been changed,
# and runs the commands after if it has been updated
run_if_updated() {
    config=${1:-}
    shift
    if ! config_file_updated "$config"; then
        echo "$config is unchanged, skipping $*"
    else
        # shellcheck disable=SC2048
        $*
        update_config_file_cache "$config"
    fi
}

install_prerequisites() {
    if [[ ! ${prerequisites_satisfied:-} == 'true' ]]; then
        assert_is_running_os "Darwin"
        attempt_installation "Homebrew" brew "install_homebrew"
        attempt_installation "Node.js" npm "install_nodejs"
        assert_has_program brew "Homebrew"
        assert_has_program npm "Node package manager "
    fi
    prerequisites_satisfied=true
}

# Define a timestamp function
# Credit to: http://stackoverflow.com/questions/17066250/create-timestamp-variable-in-bash-script
timestamp() {
  date +"%Y-%m-%d_%H-%M-%S"
}

please_say() {
    message=${1:-}
    if [ "$(uname)" == "Darwin" ]; then
        say "$message" &
    else
        tput bel || true # try to beep but continue even if we cannot
    fi
    echo "$message"
}

