#!/bin/bash

#load env. variables
source ./dq_env.sh

#kill any current running instance
killall node

# save copy of log file to file with this date
dt=`date +%Y%m%d`
cp ./logs/DQ.log "./logs/run_${dt}.log"

# clear local cache
./scripts/clear_cache.sh

# start up new instance
nohup npm start > logs/DQ.log &
