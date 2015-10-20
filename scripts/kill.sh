#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BASEDIR="$DIR/.."
run_dir="$BASEDIR/run"
#echo $run_dir
runPID=$(cat $run_dir/DQ.pid)
#echo $runPID
if [ -z $runPID ]; then
    echo 'No current PID found for DQ'
else
    echo 'attempting to kill process' $runPID
    if ! kill -9 $runPID > /dev/null 2>&1; then
        echo 'No running process' $pid 'found'
    fi
fi