#!/bin/bash
# Source common script that has BASEDIR + run_if_updated
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"/scripts/common.sh
log_dir="$BASEDIR/logs"
run_dir="$BASEDIR/run"
match_sets_dir="$BASEDIR/../DQMatchSetsLocal"
logfile="$BASEDIR/logs/DQ.log"
log_archive="$BASEDIR/logs/run_$(timestamp).log"
dev=

# Ensure we have npm before proceeding
#assert_has_program npm
# run npm install if package.json has been updated
#run_if_updated package.json npm install

# Load Environment variables
source "$BASEDIR/dq_env.sh"

# Kill any current running instance, if any are running
"$BASEDIR/scripts/kill.sh"

# Ensure directories are present
mkdir -p "$log_dir" "$run_dir" "$match_sets_dir"

# save copy of log file to file with this date
if [[ -f "$logfile" ]]; then
    cp "$logfile" "$log_archive"
fi

# clear local cache
"$BASEDIR/scripts/clear_cache.sh"

# start up new instance
if ([ $# -lt 1 ] || [ "$1" != "dev" ]); then
    nohup npm start > "$logfile" &
    echo "DQ started in the background - PID $!"
else
    nohup npm run start-dev > "$logfile" &
    echo "DQ (supervisor mode for development) started in the background - PID $!"
fi
#please_say "DQ started in the background - PID $!"
