#!/bin/bash
while true; do
	sleep 15
	curl -s http://127.0.0.1:8090/check-unconfirmed-tasks
done
