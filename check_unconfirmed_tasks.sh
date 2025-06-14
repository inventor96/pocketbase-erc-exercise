#!/bin/bash
while true; do
	sleep 15
	date
	echo ""
	curl 'http://127.0.0.1:8090/check-unconfirmed-tasks'
	echo ""
done
