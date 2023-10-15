# Pocketbase ERC Exercise

## Description

This is a simple application written for the Pocketbase backend and framework. The general idea is to generate need/resource pairs to give a real reason to pass around radio traffic for an ERC exercise. The app works with three scopes: stakes, regions, and storehouse (the top level, i.e. global). The logic tries to spread the pair across scopes as configured per exercise.

## Setup

Note that these setup instructions are for Linux hosts. You'll have to adjust and refactor stuff as necessary for other platforms.

1. Get this repo on your host.
1. If needed, update the URL in the initial config (found in `pb_migrations/1697331567_initial_settings.js`).
1. If needed, update the URL for the frontend (look for `new PocketBase` in `pb_hooks/views/base.html`).
1. Do the initial start manually (e.g. `./pocketbase serve`).
1. Create your admin user in the admin UI (e.g. if running locally, go to [http://127.0.0.1:8090/_](http://127.0.0.1:8090/_))
1. Get CSV files for the items, regions, and stakes (the old data is in the root of the repo for reference/updating; note that the trailing new line is important).
1. Get your admin auth token.
	- You can do this by inspecting the network traffic for the admin UI (the requests for "records" is a good choice), and copying the contents of the "Authorization" header.
1. Update the `csv_uploader.sh` bash script with your admin token, as well as the domain part of the 3 URLs.
1. Ensure you have the `jq` package installed on your host.
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

This was built and used with Pocketbase v0.18.10, which is also the version included in the repo. To update it, you'll need to head over to https://pocketbase.io/docs/ for the executable, and https://github.com/pocketbase/js-sdk for the browser SDK. Make sure to test to make sure the update doesn't require additional changes in the code!

## How the heck does this thing work?

Good question!

### Signup and Login

Users can signup at any time at the `/signup` URL, as well as log in at the `/login` URL. They can also click the button to indicate they're ready for needs assignments, but nothing much will happen there until you take the next steps to setup the exercise.

### Exercises

For the real magic to happen, you'll need to create a record in the `exercises` collection. Once this is created, and as long as it's in the future, the countdown timer will start. The `start` field is only for informational purposes; the exercise will not automatically start at that time. The `started` field will need to manually be set to `true` once the exercise is officially underway. Note also that the `started` field and respective functionality is not affected by the `start` timestamp; if you decide to start early, the application will go for it.

When an exercise is changed from **not started** to **started**, the application will find all users who currently have their `ready` status set to `true`, and will start working on their needs assignments. If users indicate they're ready _after_ the exercise is started, the application will immediately start working on their needs assignments.

As soon as the `end` timestamp is reached for an exercise, the countdown timer will update accordingly, and the application will stop making new assignments, even if the `started` field is still set to `true`.

### Need and Resource Assignments

For each needs assignment, a random task is selected, and then a random scope will be chosen (based on the weights/distributions defined for the exercise) to determine the pool of users to select from as the resource. Once the scope is chosen, a random user from that scope will be selected as the resource. The record is created, and then the application waits between 120 and 130 seconds for the resource user to accept the resource assignment. If the user does not accept (either by lack of response, or by explicitly rejecting the assignment), then the process repeats for selecting another user as the resource. Once a resource user accepts the assignment, then the task shows up for both the need user and the resource user.

### Fulfilling and Cancelling a Need

Once the need user finds the resource user and has received their callsign, the need user can then enter the callsign in the respective field in the web app and submit it. If the callsign is correct, the need user gets a visual confirmation, and then the need and resource are hidden from the respective users. If it's incorrect, they are informed and allowed to retry as many times as they want until it's correct.

If the user decides they are unable to find the resource user, they can click the respective button for the need assignment, and then it will be cancelled after confirmation. It is then hidden from both the need and resource users.

### Reporting

A JSON report is available publicly at the `/report` URL. This includes details about task success/failure rates per scope, a list of items that have been used in more than one task/assignment, as well as the top users for needs and resources.

**Note:** Any items that are used in more than one task will cause confusion if the respective scopes overlap, because the application will still require the callsign of the resource user as defined by the assignment, even if the item is the same. This is why that part of the report is useful.