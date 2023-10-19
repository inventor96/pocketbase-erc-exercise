/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/report", (c) => {
	// get exercise to report on
	const reporting_exercise = new DynamicModel({
		"id": "",
		"name": "",
		"start": "",
		"end": ""
	})
	try {
		// check if we looking for a specific exercise
		const exercise_id = c.queryParam("exercise_id")
		if (exercise_id) {
			$app.dao().db()
				.newQuery("SELECT id, name, start, end\
					FROM exercises\
					WHERE id = {:id}\
					LIMIT 1")
				.bind({ id: exercise_id })
				.one(reporting_exercise)
		} else {
			$app.dao().db()
				.newQuery("SELECT id, name, start, end\
					FROM exercises\
					WHERE start <= {:now}\
					ORDER BY start DESC\
					LIMIT 1")
				.bind({ now: new Date().toISOString().replace('T', ' ').substr(0, 19) })
				.one(reporting_exercise)
		}
	} catch (error) {
		c.json(404, {"error": "Could not find an exercise to report on."})
		return
	}

	// report of items that were used in multiple tasks
	const multiple_tasks = arrayOf(new DynamicModel({
		"id": "",
		"description": "",
		"count": 0
	}))
	$app.dao().db()
		.newQuery("SELECT items.id, items.description, COUNT(tasks.id) AS count\
			FROM items\
			LEFT JOIN tasks ON items.id = tasks.item\
			WHERE tasks.created BETWEEN {:start} AND {:end}\
			GROUP BY items.id\
			HAVING COUNT(tasks.id) > 1\
			ORDER BY count DESC")
		.bind({
			"start": reporting_exercise.start,
			"end": reporting_exercise.end
		})
		.all(multiple_tasks)
	const multiple_tasks_details = []
	multiple_tasks.forEach(item => {
		// get task details
		var task_details = arrayOf(new DynamicModel({
			"task_id": "",
			"need_user_callsign": "",
			"need_user_stake": "",
			"resource_user_callsign": "",
			"resource_user_stake": "",
		}))
		$app.dao().db()
			.newQuery('SELECT tasks.id AS task_id, need_users.callsign AS need_user_callsign, need_stakes.name AS need_user_stake, resource_users.callsign AS resource_user_callsign, resource_stakes.name AS resource_user_stake\
				FROM tasks\
				LEFT JOIN users AS resource_users ON resource_users.id = tasks.resource_user\
				LEFT JOIN stakes AS resource_stakes ON resource_stakes.id = resource_users.stake\
				LEFT JOIN users AS need_users ON need_users.id = tasks.need_user\
				LEFT JOIN stakes AS need_stakes ON need_stakes.id = need_users.stake\
				WHERE tasks.item = {:item_id}')
			.bind({
				"item_id": item.id
			})
			.all(task_details)
		
		// add the details to the report
		multiple_tasks_details.push({
			id: item.id,
			description: item.description,
			count: item.count,
			tasks: task_details
		})
	})

	// report of users who have fulfilled more than one need
	const top_needs_users = arrayOf(new DynamicModel({
		"username": "",
		"callsign": "",
		"count": 0
	}))
	$app.dao().db()
		.newQuery("SELECT users.username, users.callsign, COUNT(tasks.id) AS count\
			FROM users\
			LEFT JOIN tasks ON users.id = tasks.need_user\
			WHERE tasks.completed != ''\
				AND tasks.created BETWEEN {:start} AND {:end}\
			GROUP BY users.id\
			HAVING COUNT(tasks.id) > 1\
			ORDER BY count DESC")
		.bind({
			"start": reporting_exercise.start,
			"end": reporting_exercise.end
		})
		.all(top_needs_users)

	// report of users who have provided more than one resource
	const top_resource_users = arrayOf(new DynamicModel({
		"username": "",
		"callsign": "",
		"count": 0
	}))
	$app.dao().db()
		.newQuery("SELECT users.username, users.callsign, COUNT(tasks.id) AS count\
			FROM users\
			LEFT JOIN tasks ON users.id = tasks.resource_user\
			WHERE tasks.completed != ''\
				AND tasks.created BETWEEN {:start} AND {:end}\
			GROUP BY users.id\
			HAVING COUNT(tasks.id) > 1\
			ORDER BY count DESC")
		.bind({
			"start": reporting_exercise.start,
			"end": reporting_exercise.end
		})
		.all(top_resource_users)

	// count of tasks with the need and resource being in the same stake
	const stake_tasks = new DynamicModel({ "count": 0 })
	$app.dao().db()
		.newQuery("SELECT COUNT(tasks.id) AS count\
			FROM tasks\
			LEFT JOIN users AS resource_users ON resource_users.id = tasks.resource_user\
			LEFT JOIN users AS need_users ON need_users.id = tasks.need_user\
			WHERE resource_users.stake = need_users.stake\
				AND tasks.created BETWEEN {:start} AND {:end}")
		.bind({
			"start": reporting_exercise.start,
			"end": reporting_exercise.end
		})
		.one(stake_tasks)

	// count of completed tasks with the need and resource being in the same stake
	const stake_tasks_completed = new DynamicModel({ "count": 0 })
	$app.dao().db()
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
	$app.dao().db()
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

	// count of tasks with the need and resource being in the same region (excluding stake)
	const region_tasks = new DynamicModel({ "count": 0 })
	$app.dao().db()
		.newQuery("SELECT COUNT(tasks.id) AS count\
			FROM tasks\
			LEFT JOIN users AS resource_users ON resource_users.id = tasks.resource_user\
			LEFT JOIN stakes AS resource_stakes ON resource_stakes.id = resource_users.stake\
			LEFT JOIN users AS need_users ON need_users.id = tasks.need_user\
			LEFT JOIN stakes AS need_stakes ON need_stakes.id = need_users.stake\
			WHERE resource_users.stake != need_users.stake\
				AND resource_stakes.region = need_stakes.region\
				AND tasks.created BETWEEN {:start} AND {:end}")
		.bind({
			"start": reporting_exercise.start,
			"end": reporting_exercise.end
		})
		.one(region_tasks)

	// count of completed tasks with the need and resource being in the same region (excluding stake)
	const region_tasks_completed = new DynamicModel({ "count": 0 })
	$app.dao().db()
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
	$app.dao().db()
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

	// count of tasks with the need and resource NOT in the same region
	const storehouse_tasks = new DynamicModel({ "count": 0 })
	$app.dao().db()
		.newQuery("SELECT COUNT(tasks.id) AS count\
			FROM tasks\
			LEFT JOIN users AS resource_users ON resource_users.id = tasks.resource_user\
			LEFT JOIN stakes AS resource_stakes ON resource_stakes.id = resource_users.stake\
			LEFT JOIN users AS need_users ON need_users.id = tasks.need_user\
			LEFT JOIN stakes AS need_stakes ON need_stakes.id = need_users.stake\
			WHERE resource_stakes.region != need_stakes.region\
				AND tasks.created BETWEEN {:start} AND {:end}")
		.bind({
			"start": reporting_exercise.start,
			"end": reporting_exercise.end
		})
		.one(storehouse_tasks)

	// count of completed tasks with the need and resource NOT in the same region
	const storehouse_tasks_completed = new DynamicModel({ "count": 0 })
	$app.dao().db()
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
	$app.dao().db()
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

	// count of unique users who have shown evidence of participation in the exercise
	const user_participation = new DynamicModel({ "count": 0 })
	$app.dao().db()
		.newQuery("SELECT COUNT(DISTINCT id) AS count\
			FROM (\
				SELECT resource_user AS id FROM tasks\
				WHERE resource_confirmed = true\
					AND tasks.created BETWEEN {:resource_start} AND {:resource_end}\
				UNION\
				SELECT need_user AS id FROM tasks\
				WHERE (completed != '' OR cancelled != '')\
					AND tasks.created BETWEEN {:need_start} AND {:need_end}\
			)")
		.bind({
			"resource_start": reporting_exercise.start,
			"resource_end": reporting_exercise.end,
			"need_start": reporting_exercise.start,
			"need_end": reporting_exercise.end
		})
		.one(user_participation)

	// output report
	const total_tasks = stake_tasks.count + region_tasks.count + storehouse_tasks.count
	c.json(200, {
		"exercise": reporting_exercise,
		"reports": {
			"multiple_tasks": {
				"count": multiple_tasks.length,
				"description": "Items that are/were used in more than one task",
				"report": multiple_tasks_details
			},
			"top_needs_users": {
				"count": top_needs_users.length,
				"description": "Users who fulfilled more than 1 need",
				"report": top_needs_users
			},
			"top_resource_users": {
				"count": top_resource_users.length,
				"description": "Users who provided more than 1 resource",
				"report": top_resource_users
			},
			"distribution": {
				"description": "Details of tasks in each scope",
				"report": {
					"stake": {
						"total": stake_tasks.count,
						"completed": stake_tasks_completed.count,
						"cancelled": stake_tasks_cancelled.count,
						"pending": stake_tasks.count - stake_tasks_completed.count - stake_tasks_cancelled.count,
						"success": Math.round((stake_tasks_completed.count / stake_tasks.count) * 100) + "%",
						"failure": Math.round((stake_tasks_cancelled.count / stake_tasks.count) * 100) + "%",
						"scope_percentange": Math.round((stake_tasks.count / total_tasks) * 100) + "%",
					},
					"region": {
						"total": region_tasks.count,
						"completed": region_tasks_completed.count,
						"cancelled": region_tasks_cancelled.count,
						"pending": region_tasks.count - region_tasks_completed.count - region_tasks_cancelled.count,
						"success": Math.round((region_tasks_completed.count / region_tasks.count) * 100) + "%",
						"failure": Math.round((region_tasks_cancelled.count / region_tasks.count) * 100) + "%",
						"scope_percentange": Math.round((region_tasks.count / total_tasks) * 100) + "%",
					},
					"storehouse": {
						"total": storehouse_tasks.count,
						"completed": storehouse_tasks_completed.count,
						"cancelled": storehouse_tasks_cancelled.count,
						"pending": storehouse_tasks.count - storehouse_tasks_completed.count - storehouse_tasks_cancelled.count,
						"success": Math.round((storehouse_tasks_completed.count / storehouse_tasks.count) * 100) + "%",
						"failure": Math.round((storehouse_tasks_cancelled.count / storehouse_tasks.count) * 100) + "%",
						"scope_percentange": Math.round((storehouse_tasks.count / total_tasks) * 100) + "%",
					},
				}
			},
			"user_participation": {
				"description": "The number of users with evidence of participation in the exercise",
				"report": user_participation.count
			}
		}
	})
})