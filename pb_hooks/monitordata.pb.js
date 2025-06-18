/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/monitordata", function (e) {
	// get exercise to report on
	const reporting_exercise = new DynamicModel({
		"id": "",
		"name": "",
		"start": "",
		"end": ""
	})
	try {
		// check if we looking for a specific exercise
		const exercise_id = e.request.url.query().get("exercise_id")
		if (exercise_id) {
			$app.db()
				.newQuery("SELECT id, name, start, end\
					FROM exercises\
					WHERE id = {:id}\
					LIMIT 1")
				.bind({ id: exercise_id })
				.one(reporting_exercise)
		} else {
			$app.db()
				.newQuery("SELECT id, name, start, end\
					FROM exercises\
					WHERE start <= {:now}\
					ORDER BY start DESC\
					LIMIT 1")
				.bind({ now: new Date().toISOString().replace('T', ' ').substr(0, 19) })
				.one(reporting_exercise)
		}
	} catch (error) {
		e.json(404, {"error": "Could not find an exercise to report on."})
		return
	}

	// build participant data
	const participant_data = arrayOf(new DynamicModel({
		"name": "",
		"participants": 0,
	}))
	$app.db()
		.newQuery("SELECT regions.name AS name, COUNT(DISTINCT user_participation.id) AS participants\
			FROM (\
				SELECT users.id, users.stake\
				FROM tasks\
				LEFT JOIN users ON tasks.resource_user = users.id\
				WHERE tasks.resource_confirmed = true\
					AND tasks.created BETWEEN {:start} AND {:end}\
				UNION\
				SELECT users.id, users.stake\
				FROM tasks\
				LEFT JOIN users ON tasks.need_user = users.id\
				WHERE (tasks.completed != '' OR tasks.cancelled != '')\
					AND tasks.created BETWEEN {:start} AND {:end}\
			) AS user_participation\
			LEFT JOIN stakes ON user_participation.stake = stakes.id\
			LEFT JOIN regions ON stakes.region = regions.id\
			GROUP BY regions.name\
			ORDER BY regions.name")
		.bind({
			"start": reporting_exercise.start,
			"end": reporting_exercise.end
		})
		.all(participant_data)
	const total_participants = participant_data.reduce((acc, region) => acc + region.participants, 0)

	// get number of users per communication type
	const commTypeCounts = arrayOf(new DynamicModel({
		"name": "",
		"count": 0,
	}))
	$app.db()
		.newQuery("SELECT users.comm_type AS name, COUNT(DISTINCT user_participation.id) AS count\
			FROM (\
				SELECT users.id, users.comm_type\
				FROM tasks\
				LEFT JOIN users ON tasks.resource_user = users.id\
				WHERE tasks.resource_confirmed = true\
					AND tasks.created BETWEEN {:start} AND {:end}\
				UNION\
				SELECT users.id, users.comm_type\
				FROM tasks\
				LEFT JOIN users ON tasks.need_user = users.id\
				WHERE (tasks.completed != '' OR tasks.cancelled != '')\
					AND tasks.created BETWEEN {:start} AND {:end}\
			) AS user_participation\
			LEFT JOIN users ON users.id = user_participation.id\
			GROUP BY users.comm_type\
			ORDER BY count DESC, name")
		.bind({
			"start": reporting_exercise.start,
			"end": reporting_exercise.end
		})
		.all(commTypeCounts)

	// count of open tasks with the need and resource being in the same stake
	const stake_tasks_open = new DynamicModel({ "count": 0 })
	$app.db()
		.newQuery("SELECT COUNT(tasks.id) AS count\
			FROM tasks\
			LEFT JOIN users AS resource_users ON resource_users.id = tasks.resource_user\
			LEFT JOIN users AS need_users ON need_users.id = tasks.need_user\
			WHERE resource_users.stake = need_users.stake\
				AND tasks.created BETWEEN {:start} AND {:end}\
				AND tasks.resource_confirmed = true\
				AND tasks.cancelled = ''\
				AND tasks.completed = ''")
		.bind({
			"start": reporting_exercise.start,
			"end": reporting_exercise.end
		})
		.one(stake_tasks_open)

	// count of completed tasks with the need and resource being in the same stake
	const stake_tasks_completed = new DynamicModel({ "count": 0 })
	$app.db()
		.newQuery("SELECT COUNT(tasks.id) AS count\
			FROM tasks\
			LEFT JOIN users AS resource_users ON resource_users.id = tasks.resource_user\
			LEFT JOIN users AS need_users ON need_users.id = tasks.need_user\
			WHERE resource_users.stake = need_users.stake\
				AND tasks.completed != ''\
				AND tasks.created BETWEEN {:start} AND {:end}")
		.bind({
			"start": reporting_exercise.start,
			"end": reporting_exercise.end
		})
		.one(stake_tasks_completed)

	// count of cancelled tasks with the need and resource being in the same stake
	const stake_tasks_cancelled = new DynamicModel({ "count": 0 })
	$app.db()
		.newQuery("SELECT COUNT(tasks.id) AS count\
			FROM tasks\
			LEFT JOIN users AS resource_users ON resource_users.id = tasks.resource_user\
			LEFT JOIN users AS need_users ON need_users.id = tasks.need_user\
			WHERE resource_users.stake = need_users.stake\
				AND tasks.cancelled != ''\
				AND tasks.created BETWEEN {:start} AND {:end}")
		.bind({
			"start": reporting_exercise.start,
			"end": reporting_exercise.end
		})
		.one(stake_tasks_cancelled)

	// count of open tasks with the need and resource being in the same region (excluding stake)
	const region_tasks_open = new DynamicModel({ "count": 0 })
	$app.db()
		.newQuery("SELECT COUNT(tasks.id) AS count\
			FROM tasks\
			LEFT JOIN users AS resource_users ON resource_users.id = tasks.resource_user\
			LEFT JOIN stakes AS resource_stakes ON resource_stakes.id = resource_users.stake\
			LEFT JOIN users AS need_users ON need_users.id = tasks.need_user\
			LEFT JOIN stakes AS need_stakes ON need_stakes.id = need_users.stake\
			WHERE resource_users.stake != need_users.stake\
				AND resource_stakes.region = need_stakes.region\
				AND tasks.resource_confirmed = true\
				AND tasks.cancelled = ''\
				AND tasks.completed = ''\
				AND tasks.created BETWEEN {:start} AND {:end}")
		.bind({
			"start": reporting_exercise.start,
			"end": reporting_exercise.end
		})
		.one(region_tasks_open)

	// count of completed tasks with the need and resource being in the same region (excluding stake)
	const region_tasks_completed = new DynamicModel({ "count": 0 })
	$app.db()
		.newQuery("SELECT COUNT(tasks.id) AS count\
			FROM tasks\
			LEFT JOIN users AS resource_users ON resource_users.id = tasks.resource_user\
			LEFT JOIN stakes AS resource_stakes ON resource_stakes.id = resource_users.stake\
			LEFT JOIN users AS need_users ON need_users.id = tasks.need_user\
			LEFT JOIN stakes AS need_stakes ON need_stakes.id = need_users.stake\
			WHERE resource_users.stake != need_users.stake\
				AND resource_stakes.region = need_stakes.region\
				AND tasks.completed != ''\
				AND tasks.created BETWEEN {:start} AND {:end}")
		.bind({
			"start": reporting_exercise.start,
			"end": reporting_exercise.end
		})
		.one(region_tasks_completed)

	// count of cancelled tasks with the need and resource being in the same region (excluding stake)
	const region_tasks_cancelled = new DynamicModel({ "count": 0 })
	$app.db()
		.newQuery("SELECT COUNT(tasks.id) AS count\
			FROM tasks\
			LEFT JOIN users AS resource_users ON resource_users.id = tasks.resource_user\
			LEFT JOIN stakes AS resource_stakes ON resource_stakes.id = resource_users.stake\
			LEFT JOIN users AS need_users ON need_users.id = tasks.need_user\
			LEFT JOIN stakes AS need_stakes ON need_stakes.id = need_users.stake\
			WHERE resource_users.stake != need_users.stake\
				AND resource_stakes.region = need_stakes.region\
				AND tasks.cancelled != ''\
				AND tasks.created BETWEEN {:start} AND {:end}")
		.bind({
			"start": reporting_exercise.start,
			"end": reporting_exercise.end
		})
		.one(region_tasks_cancelled)

	// count of open tasks with the need and resource NOT in the same region (i.e. storehouse)
	const storehouse_tasks_open = new DynamicModel({ "count": 0 })
	$app.db()
		.newQuery("SELECT COUNT(tasks.id) AS count\
			FROM tasks\
			LEFT JOIN users AS resource_users ON resource_users.id = tasks.resource_user\
			LEFT JOIN stakes AS resource_stakes ON resource_stakes.id = resource_users.stake\
			LEFT JOIN users AS need_users ON need_users.id = tasks.need_user\
			LEFT JOIN stakes AS need_stakes ON need_stakes.id = need_users.stake\
			WHERE resource_stakes.region != need_stakes.region\
				AND tasks.resource_confirmed = true\
				AND tasks.cancelled = ''\
				AND tasks.completed = ''\
				AND tasks.created BETWEEN {:start} AND {:end}")
		.bind({
			"start": reporting_exercise.start,
			"end": reporting_exercise.end
		})
		.one(storehouse_tasks_open)

	// count of completed tasks with the need and resource NOT in the same region
	const storehouse_tasks_completed = new DynamicModel({ "count": 0 })
	$app.db()
		.newQuery("SELECT COUNT(tasks.id) AS count\
			FROM tasks\
			LEFT JOIN users AS resource_users ON resource_users.id = tasks.resource_user\
			LEFT JOIN stakes AS resource_stakes ON resource_stakes.id = resource_users.stake\
			LEFT JOIN users AS need_users ON need_users.id = tasks.need_user\
			LEFT JOIN stakes AS need_stakes ON need_stakes.id = need_users.stake\
			WHERE resource_stakes.region != need_stakes.region\
				AND tasks.completed != ''\
				AND tasks.created BETWEEN {:start} AND {:end}")
		.bind({
			"start": reporting_exercise.start,
			"end": reporting_exercise.end
		})
		.one(storehouse_tasks_completed)

	// count of cancelled tasks with the need and resource NOT in the same region
	const storehouse_tasks_cancelled = new DynamicModel({ "count": 0 })
	$app.db()
		.newQuery("SELECT COUNT(tasks.id) AS count\
			FROM tasks\
			LEFT JOIN users AS resource_users ON resource_users.id = tasks.resource_user\
			LEFT JOIN stakes AS resource_stakes ON resource_stakes.id = resource_users.stake\
			LEFT JOIN users AS need_users ON need_users.id = tasks.need_user\
			LEFT JOIN stakes AS need_stakes ON need_stakes.id = need_users.stake\
			WHERE resource_stakes.region != need_stakes.region\
				AND tasks.cancelled != ''\
				AND tasks.created BETWEEN {:start} AND {:end}")
		.bind({
			"start": reporting_exercise.start,
			"end": reporting_exercise.end
		})
		.one(storehouse_tasks_cancelled)

	// count of open tasks per region
	const region_tasks_open_by_region = arrayOf(new DynamicModel({
		"name": "",
		"count": 0,
	}))
	$app.db()
		.newQuery("SELECT regions.name, COUNT(tasks.id) AS count\
			FROM tasks\
			LEFT JOIN users ON users.id = tasks.need_user\
			LEFT JOIN stakes ON stakes.id = users.stake\
			LEFT JOIN regions ON stakes.region = regions.id\
			WHERE tasks.resource_confirmed = true\
				AND tasks.cancelled = ''\
				AND tasks.completed = ''\
				AND tasks.created BETWEEN {:start} AND {:end}\
			GROUP BY regions.name\
			ORDER BY regions.name")
		.bind({
			"start": reporting_exercise.start,
			"end": reporting_exercise.end
		})
		.all(region_tasks_open_by_region)

	// count of completed tasks per region
	const region_tasks_completed_by_region = arrayOf(new DynamicModel({
		"name": "",
		"count": 0,
	}))
	$app.db()
		.newQuery("SELECT regions.name, COUNT(tasks.id) AS count\
			FROM tasks\
			LEFT JOIN users ON users.id = tasks.need_user\
			LEFT JOIN stakes ON stakes.id = users.stake\
			LEFT JOIN regions ON stakes.region = regions.id\
			WHERE tasks.completed != ''\
				AND tasks.created BETWEEN {:start} AND {:end}\
			GROUP BY regions.name\
			ORDER BY regions.name")
		.bind({
			"start": reporting_exercise.start,
			"end": reporting_exercise.end
		})
		.all(region_tasks_completed_by_region)

	// count of cancelled tasks per region
	const region_tasks_cancelled_by_region = arrayOf(new DynamicModel({
		"name": "",
		"count": 0,
	}))
	$app.db()
		.newQuery("SELECT regions.name, COUNT(tasks.id) AS count\
			FROM tasks\
			LEFT JOIN users ON users.id = tasks.need_user\
			LEFT JOIN stakes ON stakes.id = users.stake\
			LEFT JOIN regions ON stakes.region = regions.id\
			WHERE tasks.cancelled != ''\
				AND tasks.created BETWEEN {:start} AND {:end}\
			GROUP BY regions.name\
			ORDER BY regions.name")
		.bind({
			"start": reporting_exercise.start,
			"end": reporting_exercise.end
		})
		.all(region_tasks_cancelled_by_region)

	// organize region data to be per-region
	const region_data = {}
	region_tasks_open_by_region.forEach(region => {
		if (!region_data[region.name]) {
			region_data[region.name] = {
				"open": 0,
				"fulfilled": 0,
				"skipped": 0,
			}
		}
		region_data[region.name].open += region.count
	})
	region_tasks_completed_by_region.forEach(region => {
		if (!region_data[region.name]) {
			region_data[region.name] = {
				"open": 0,
				"fulfilled": 0,
				"skipped": 0,
			}
		}
		region_data[region.name].fulfilled += region.count
	})
	region_tasks_cancelled_by_region.forEach(region => {
		if (!region_data[region.name]) {
			region_data[region.name] = {
				"open": 0,
				"fulfilled": 0,
				"skipped": 0,
			}
		}
		region_data[region.name].skipped += region.count
	})

	// get times between task creation and completion with the need and resource being in the same stake
	const stake_tasks_time = arrayOf(new DynamicModel({
		"completed": "",
		"created": "",
	}))
	$app.db()
		.newQuery("SELECT tasks.completed, tasks.created\
			FROM tasks\
			LEFT JOIN users AS resource_users ON resource_users.id = tasks.resource_user\
			LEFT JOIN users AS need_users ON need_users.id = tasks.need_user\
			WHERE resource_users.stake = need_users.stake\
				AND tasks.completed != ''\
				AND tasks.created BETWEEN {:start} AND {:end}")
		.bind({
			"start": reporting_exercise.start,
			"end": reporting_exercise.end
		})
		.all(stake_tasks_time)
	const stake_tasks_times = stake_tasks_time.map(task => {
		const createdStr = typeof task.created === "string" ? task.created.replace(' ', 'T') : task.created
		const completedStr = typeof task.completed === "string" ? task.completed.replace(' ', 'T') : task.completed
		const created = new Date(createdStr).getTime()
		const completed = new Date(completedStr).getTime()
		if (isNaN(created) || isNaN(completed)) {
			return null
		}
		return completed - created
	})
	.filter(time => time !== null && !isNaN(time))

	// calculate average, min, and max times for stake tasks
	const stake_tasks_time_sum = stake_tasks_times.reduce((acc, time) => acc + time, 0)
	const stake_tasks_time_avg = stake_tasks_times.length > 0 ? stake_tasks_time_sum / stake_tasks_times.length : null
	const stake_tasks_time_min = stake_tasks_times.length > 0 ? Math.min(...stake_tasks_times) : null
	const stake_tasks_time_max = stake_tasks_times.length > 0 ? Math.max(...stake_tasks_times) : null

	// format times for stake tasks
	const stake_tasks_time_min_formatted = stake_tasks_time_min !== null ? new Date(stake_tasks_time_min).toISOString().substr(11, 8) : '--'
	const stake_tasks_time_max_formatted = stake_tasks_time_max !== null ? new Date(stake_tasks_time_max).toISOString().substr(11, 8) : '--'
	const stake_tasks_time_avg_formatted = stake_tasks_time_avg !== null ? new Date(stake_tasks_time_avg).toISOString().substr(11, 8) : '--'

	// get times between task creation and completion with the need and resource being in the same region (excluding stake)
	const region_tasks_time = arrayOf(new DynamicModel({
		"completed": "",
		"created": "",
	}))
	$app.db()
		.newQuery("SELECT tasks.completed, tasks.created\
			FROM tasks\
			LEFT JOIN users AS resource_users ON resource_users.id = tasks.resource_user\
			LEFT JOIN stakes AS resource_stakes ON resource_stakes.id = resource_users.stake\
			LEFT JOIN users AS need_users ON need_users.id = tasks.need_user\
			LEFT JOIN stakes AS need_stakes ON need_stakes.id = need_users.stake\
			WHERE resource_users.stake != need_users.stake\
				AND resource_stakes.region = need_stakes.region\
				AND tasks.completed != ''\
				AND tasks.created BETWEEN {:start} AND {:end}")
		.bind({
			"start": reporting_exercise.start,
			"end": reporting_exercise.end
		})
		.all(region_tasks_time)
	const region_tasks_times = region_tasks_time.map(task => {
		const createdStr = typeof task.created === "string" ? task.created.replace(' ', 'T') : task.created
		const completedStr = typeof task.completed === "string" ? task.completed.replace(' ', 'T') : task.completed
		const created = new Date(createdStr).getTime()
		const completed = new Date(completedStr).getTime()
		if (isNaN(created) || isNaN(completed)) {
			return null
		}
		return completed - created
	})
	.filter(time => time !== null && !isNaN(time))

	// calculate average, min, and max times for region tasks
	const region_tasks_time_sum = region_tasks_times.reduce((acc, time) => acc + time, 0)
	const region_tasks_time_avg = region_tasks_times.length > 0 ? region_tasks_time_sum / region_tasks_times.length : null
	const region_tasks_time_min = region_tasks_times.length > 0 ? Math.min(...region_tasks_times) : null
	const region_tasks_time_max = region_tasks_times.length > 0 ? Math.max(...region_tasks_times) : null

	// format times for region tasks
	const region_tasks_time_min_formatted = region_tasks_time_min !== null ? new Date(region_tasks_time_min).toISOString().substr(11, 8) : '--'
	const region_tasks_time_max_formatted = region_tasks_time_max !== null ? new Date(region_tasks_time_max).toISOString().substr(11, 8) : '--'
	const region_tasks_time_avg_formatted = region_tasks_time_avg !== null ? new Date(region_tasks_time_avg).toISOString().substr(11, 8) : '--'

	// get times between task creation and completion with the need and resource NOT in the same region (i.e. storehouse)
	const storehouse_tasks_time = arrayOf(new DynamicModel({
		"completed": "",
		"created": "",
	}))
	$app.db()
		.newQuery("SELECT tasks.completed, tasks.created\
			FROM tasks\
			LEFT JOIN users AS resource_users ON resource_users.id = tasks.resource_user\
			LEFT JOIN stakes AS resource_stakes ON resource_stakes.id = resource_users.stake\
			LEFT JOIN users AS need_users ON need_users.id = tasks.need_user\
			LEFT JOIN stakes AS need_stakes ON need_stakes.id = need_users.stake\
			WHERE resource_stakes.region != need_stakes.region\
				AND tasks.completed != ''\
				AND tasks.created BETWEEN {:start} AND {:end}")
		.bind({
			"start": reporting_exercise.start,
			"end": reporting_exercise.end
		})
		.all(storehouse_tasks_time)
	const storehouse_tasks_times = storehouse_tasks_time.map(task => {
		const createdStr = typeof task.created === "string" ? task.created.replace(' ', 'T') : task.created
		const completedStr = typeof task.completed === "string" ? task.completed.replace(' ', 'T') : task.completed
		const created = new Date(createdStr).getTime()
		const completed = new Date(completedStr).getTime()
		if (isNaN(created) || isNaN(completed)) {
			return null
		}
		return completed - created
	})
	.filter(time => time !== null && !isNaN(time))

	// calculate average, min, and max times for storehouse tasks
	const storehouse_tasks_time_sum = storehouse_tasks_times.reduce((acc, time) => acc + time, 0)
	const storehouse_tasks_time_avg = storehouse_tasks_times.length > 0 ? storehouse_tasks_time_sum / storehouse_tasks_times.length : null
	const storehouse_tasks_time_min = storehouse_tasks_times.length > 0 ? Math.min(...storehouse_tasks_times) : null
	const storehouse_tasks_time_max = storehouse_tasks_times.length > 0 ? Math.max(...storehouse_tasks_times) : null

	// format times for storehouse tasks
	const storehouse_tasks_time_min_formatted = storehouse_tasks_time_min !== null ? new Date(storehouse_tasks_time_min).toISOString().substr(11, 8) : '--'
	const storehouse_tasks_time_max_formatted = storehouse_tasks_time_max !== null ? new Date(storehouse_tasks_time_max).toISOString().substr(11, 8) : '--'
	const storehouse_tasks_time_avg_formatted = storehouse_tasks_time_avg !== null ? new Date(storehouse_tasks_time_avg).toISOString().substr(11, 8) : '--'

	// total number of registered users
	const registered_users = new DynamicModel({
		"count": 0,
	})
	$app.db()
		.newQuery("SELECT COUNT(id) as count FROM users")
		.one(registered_users)

	// output
	e.json(200, {
		"participants": {
			"by_region": participant_data,
			"by_service": commTypeCounts,
			"total": total_participants,
			"registered": registered_users.count,
		},
		"tasks": {
			"scope": {
				"stake": {
					"open": stake_tasks_open.count,
					"fulfilled": stake_tasks_completed.count,
					"skipped": stake_tasks_cancelled.count,
					"avg_time": stake_tasks_time_avg_formatted,
					"min_time": stake_tasks_time_min_formatted,
					"max_time": stake_tasks_time_max_formatted,
				},
				"region": {
					"open": region_tasks_open.count,
					"fulfilled": region_tasks_completed.count,
					"skipped": region_tasks_cancelled.count,
					"avg_time": region_tasks_time_avg_formatted,
					"min_time": region_tasks_time_min_formatted,
					"max_time": region_tasks_time_max_formatted,
				},
				"storehouse": {
					"open": storehouse_tasks_open.count,
					"fulfilled": storehouse_tasks_completed.count,
					"skipped": storehouse_tasks_cancelled.count,
					"avg_time": storehouse_tasks_time_avg_formatted,
					"min_time": storehouse_tasks_time_min_formatted,
					"max_time": storehouse_tasks_time_max_formatted,
				},
			},
			"region": region_data,
			"total": {
				"open": stake_tasks_open.count + region_tasks_open.count + storehouse_tasks_open.count,
				"fulfilled": stake_tasks_completed.count + region_tasks_completed.count + storehouse_tasks_completed.count,
				"skipped": stake_tasks_cancelled.count + region_tasks_cancelled.count + storehouse_tasks_cancelled.count,
			}
		},
	})
})