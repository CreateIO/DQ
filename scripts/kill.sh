#!/bin/bash

myPID=$$

runPID=`cat ~/DQ/run/DQ.pid`
DQPID=`ps -eo pid,ppid,cmd "$runPID" | grep "sh -c node app.js" | grep '$myPID     0'`

if [ -z "$DQPID" ]; then
  DQPID=`ps -eo pid,ppid,cmd | grep "sh -c node app.js" | grep -v "$myPID" | (read a b c; echo $a) ` 
fi

echo "killing $DQPID"
kill $DQPID

