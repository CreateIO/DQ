#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BASEDIR="$DIR/.."
run_dir="$BASEDIR/run"
echo $run_dir
runPID=$(cat $run_dir/DQ.pid)
echo $runPID
if [ -z $runPID ]; then
    echo 'No current PID found for DQ'
else
    echo 'attempting to kill process' $runPID
    running=$(kill -0 $runPID)
    echo $running
    if [ -z "$running" ]; then
        kill -9 $runPID
    else
        echo 'No running process' $pid 'found'
    fi
fi