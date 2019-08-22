#!/bin/bash

ID=`docker-compose ps -q "$1"`
PID=`docker inspect "$ID" --format '{{.State.Pid}}'`
sudo nsenter --target "$PID" --mount --uts --ipc --net --pid /bin/sh
