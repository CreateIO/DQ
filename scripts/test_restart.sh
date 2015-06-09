#!/bin/bash

myPID=$$
touch ~/DQ/run/DQ.pid
runPID=`cat ~/DQ/run/DQ.pid`
if [ -n "$runPID" ]; then
    DQPID=`ps -eo pid,ppid,cmd "$runPID" | grep "sh -c node app.js" | grep -v "grep"`
else
    DQPID=''
fi

if [ -z "$DQPID" ]; then
  DQPID=`ps -eo pid,ppid,cmd | grep "sh -c node app.js" | grep -v "$myPID" | grep -v "grep" | (read a b c; echo $a) ` 
fi

if [ -z "$DQPID" ]; then
    echo "DQPID is $DQPID"
    /home/ubuntu/DQ/start.sh
fi


