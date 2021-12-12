#!/bin/bash

#start app 
nohup node ../src/index.js > fhm-rebase-bot.log 2>&1 &
echo $! > fhm-rebase-bot.pid
