# Pocketbase ERC Exercise
## Description
This is a simple application written for the [Pocketbase backend and framework](https://pocketbase.io/). The general idea is to generate need/resource pairs to give a real reason to pass around radio traffic for an ERC exercise. One user/participate/operator is assigned the need, and another one is assigned the matching resource. It's then the responsibility of "need" user (and the necessary net control stations) to then find the "resource" user. The app works with three scopes: stakes, regions, and storehouse (the top level, i.e. global). The app spreads the pair across scopes as configured per exercise.

The application is built to handle only one exercise at a time. If more than one exercise needs to happen at a time, you should create separate instances.

## Setup
Note that these setup instructions are geared toward Linux hosts. You'll have to adjust and refactor stuff as necessary for other platforms.

1. Get this repo on your host.
1. Before proceeding, consider the point in [Production-ready Setup](#production-ready-setup) regarding a reverse proxy.
1. If needed, update the URL in the initial config (found in `pb_migrations/1697331567_initial_settings.js`).
1. Start the server (e.g. `systemctl start pocketbase-erc` if you setup the systemd service, or `./pocketbase serve` to just do it manually).
1. Create your admin user in the PocketBase Admin UI at `/_` (e.g. if running locally, go to `http://127.0.0.1:8090/_`).
1. If you want to enable password reset emails, you'll need to set up the SMTP settings in the PocketBase Admin UI.

Congrats! The application is functional!

## Adding Data
In the Exercise Admin UI (at `/admin`, this is different than the PocketBase Admin UI at `/_`), you can manage individual Exercises, Regions, Stakes, and Items. You can also upload Regions, Stakes, and Items from CSV files to bulk-add them. The CSV uploading is especially helpful when getting started.

To import from CSV files:
1. Review the CSV files in the [`csv_examples`](csv_examples) directory. There are three categories:
	- `regions` and `stakes`: Regions are groups of Stakes, and users indicate which Stake they're participating from/in.
	- `items`: Contains the items that can be used in assignments during the exercise.
1. Edit the CSV files as necessary, or create your own. The file should include headers (i.e. the first row being the column names). The headers are **case-sensitive**, but they can be in any order. The column names depend on the category:
	- `regions`:
		- Name
	- `stakes`:
		- Name
		- Region (the name of an existing Region)
	- `items`:
		- Description
		- Quantity (can be more than just a number, e.g. "pack of 80")
		- Priority (one of: Emergency, Priority, Welfare, Routine)
1. Log in to the Exercise Admin UI.
1. Click the "Upload CSV" button for a category, then select the desired file for that category.

That's it! You should have a complete ERC Exercise site ready to go.

## Production-ready Setup
Just a few more things to get you ready for go-time.

1. (Optional, but highly recommended) Consider using a reverse proxy so you can use a nice domain and HTTPS.
1. (Optional, but highly recommended) Create a system service for the application. e.g. for a systemd service on a Linux host, create `/etc/systemd/system/pocketbase-erc.service`:
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
Users can signup at any time at the `/signup` URL. They log in at the `/login` URL. They can also click the button to indicate they're ready for needs assignments, but nothing much will happen there until you take the next steps to setup the exercise.

### Exercises
For the real magic to happen, you'll need to create an exercises in the admin portal (at `/admin`). Once this is created, and as long as it's in the future, the countdown timer will start. The `start` timestamp is only for informational purposes; the exercise will not automatically start at that time. When you're ready to actually start the exercise, use the respective button for the exercise on the admin portal. Because the `start` timestamp does not really affect anything, if you decide to start early, the application will go for it. However, the [monitoring](#monitoring) and [reporting](#reporting) will only show stats for the time between the `start` and `end` timestamps of the exercise.

When an exercise is changed from **not started** to **started**, the application will find all users who currently have their `ready` status set to `true`, and will start working on their needs assignments. If users indicate they're ready _after_ the exercise is started, the application will immediately start working on their needs assignments.

As soon as the `end` timestamp is reached for an exercise, the countdown timer will update accordingly, and the application will stop making new assignments, even if the `started` field is still set to `true`.

### Need and Resource Assignments
For each needs assignment (or task), a random item is selected (priorizing the least used items first), then a random scope (stake, region, storehouse) will be chosen based on the weights/distributions defined for the exercise, and finally a user from the scope's pool is selected as the resource user. The record is created, and then the application waits between 120 and 130 seconds for the resource user to accept the resource assignment. If the user does not accept (either by lack of response, or by explicitly rejecting the assignment), then the process repeats for selecting another user as the resource. Once a resource user accepts the assignment, then the task shows up for both the need user and the resource user.

### Fulfilling and Cancelling a Need
Once the need user finds the resource user and has received their callsign, the need user can then enter the callsign in the respective field in the web app and submit it. If the callsign is correct, the need user gets a visual confirmation, and then the need/resource is moved into the respective statistics column for each user. If it's incorrect, they are informed and allowed to retry as many times as they want until it's correct.

If the user decides they are unable to find the resource user, they can click the respective button for the need assignment, and then it will be cancelled after confirmation. It is then hidden from both the need and resource users.

### Monitoring
The application has a monitoring page at `/monitor` that shows information about the current exercise, including various details about the participating users and needs/resource assignments. This page is accessible publicly. Optionally, you can query for a specific exercise by adding the `exercise_id` query parameter to the URL. e.g. `/monitor?exercise_id=ID_FROM_THE_COLLECTION`.

### Reporting
A JSON report is available publicly at the `/report` URL. This includes details about task success/failure rates per scope, a list of items that have been used in more than one task/assignment, the top users for needs and resources, and a participation head count. By default, the report shows stats for the timeframe of the most recent exercise for which the start time has passed (irrespective of the `started` status). Optionally, you can query for a specific exercise by adding the `exercise_id` query parameter to the URL. e.g. `/report?exercise_id=ID_FROM_THE_COLLECTION`.

**Note:** Any items that are used in more than one task will cause confusion if the respective scopes overlap, because the application will still require the callsign of the resource user as defined by the assignment, even if the item is the same. This is why that part of the report is useful.