# Pocketbase ERC Exercise

## Description

This is a simple application written for the Pocketbase backend and framework. The general idea is to generate need/resource pairs to give a real reason to pass around radio traffic for an ERC exercise.

## Setup

Note that these setup instructions are for Linux hosts. You'll have to adjust and refactor stuff as necessary for other platforms.

1. Get this repo on your host.
1. Update the URL in the initial config (found in `pb_migrations/1697331567_initial_settings.js`)
1. Update the URL for the frontend (look for `new PocketBase` in `pb_hooks/views/base.html`)
1. Do the initial start manually (e.g. `./pocketbase serve`).
1. Create your admin user in the admin UI (e.g. if running locally, go to [http://127.0.0.1:8090/_])
1. Get CSV files for the items, regions, and stakes (the old data is in the root of the repo for reference/updating; note that the trailing new line is important).
1. Get your admin auth token.
	- You can do this by inspecting the network traffic for the admin UI (the requests for "records" is a good choice), and copying the contents of the "Authorization" header.
1. Update the `csv_uploader.sh` bash script with your admin token, as well as the domain part of the 3 URLs.
1. Ensure you have the `jq` package installed on your host
1. Run the script (e.g. `./csv_uploader.sh`) to upload the items, regions, and stakes.

Congrats! The application is functional!

## Production-ready Setup

Just a few more things to get you ready for go-time.

1. (Optional, but highly recommended) Consider using a reverse proxy so you can use a nice domain and HTTPS.
1. (Optional, but highly recommended) Create a system service for the application. e.g. `/etc/systemd/system/pocketbase-erc.service`:
	```ini
	[Unit]
	Description=Pocketbase - ERC Exercise
	After=network.target

	[Service]
	User=www-data
	Group=www-data
	ExecStart=/your/repo/path/pocketbase serve
	Restart=always

	[Install]
	WantedBy=multi-user.target
	```
1. (Sorta optional, but basically required for user sanity) Create a system service that triggers the handling of unconfirmed tasks. e.g. `/etc/systemd/system/pocketbase-erc-check.service`:
	```ini
	[Unit]
	Description=Pocketbase - ERC Exercise - check unconfirmed tasks
	After=network.target

	[Service]
	User=www-data
	Group=www-data
	ExecStart=/your/repo/path/check_unconfirmed_tasks.sh
	Restart=always

	[Install]
	WantedBy=multi-user.target
	```

## Pocketbase Updates

This was built and used with Pocketbase v0.18.10, which is also the version included in the repo. To update it, you'll need to head over to [https://pocketbase.io/docs/] for the executable, and [https://github.com/pocketbase/js-sdk] for the browser SDK. Make sure to test to make sure the update doesn't require additional changes in the code!