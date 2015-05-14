#!/bin/bash

#load env. variables
source ./dq_env.sh

#kill any current running instance
killall node

#start up new instance
nohup npm start > logs/DQ.log &
