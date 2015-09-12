#!/bin/bash

set -e

dt=`date +%Y%m%d`

logfile="/data/DQ/DQ/logs/run_${dt}.log"
errfile="/data/DQ/DQ/logs/err_${dt}.log"

touch ${logfile}
touch ${errfile}

(
    echo "*************************"
    echo "Starting the DQ service"
    echo "*************************"
    /bin/uname -a
    /usr/bin/uptime
    echo "*************************"
) >>$logfile


cd /data/DQ/DQ
./run_DQ.sh


