/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/report", (c) => {
	const multiple_tasks = arrayOf(new DynamicModel({
		"id": "",
		"description": "",
		"count": 0
	}))
	$app.dao().db()
		.newQuery("SELECT items.id, items.description, COUNT(tasks.id) AS count\
			FROM items\
			LEFT JOIN tasks ON items.id = tasks.item\
			GROUP BY items.id\
			HAVING COUNT(tasks.id) > 1\
			ORDER BY count DESC")
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
			GROUP BY users.id\
			HAVING COUNT(tasks.id) > 1\
			ORDER BY count DESC")
		.all(top_needs_users)

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
			GROUP BY users.id\
			HAVING COUNT(tasks.id) > 1\
			ORDER BY count DESC")
		.all(top_resource_users)

	const stake_tasks = new DynamicModel({ "count": 0 })
	$app.dao().db()
		.newQuery("SELECT COUNT(tasks.id) AS count\
			FROM tasks\
			LEFT JOIN users AS resource_users ON resource_users.id = tasks.resource_user\
			LEFT JOIN users AS need_users ON need_users.id = tasks.need_user\
			WHERE resource_users.stake = need_users.stake")
		.one(stake_tasks)

	const stake_tasks_completed = new DynamicModel({ "count": 0 })
	$app.dao().db()
		.newQuery("SELECT COUNT(tasks.id) AS count\
			FROM tasks\
			LEFT JOIN users AS resource_users ON resource_users.id = tasks.resource_user\
			LEFT JOIN users AS need_users ON need_users.id = tasks.need_user\
			WHERE resource_users.stake = need_users.stake\
				AND tasks.completed != ''")
		.one(stake_tasks_completed)

	const stake_tasks_cancelled = new DynamicModel({ "count": 0 })
	$app.dao().db()
		.newQuery("SELECT COUNT(tasks.id) AS count\
			FROM tasks\
			LEFT JOIN users AS resource_users ON resource_users.id = tasks.resource_user\
			LEFT JOIN users AS need_users ON need_users.id = tasks.need_user\
			WHERE resource_users.stake = need_users.stake\
				AND tasks.cancelled != ''")
		.one(stake_tasks_cancelled)

	const region_tasks = new DynamicModel({ "count": 0 })
	$app.dao().db()
		.newQuery("SELECT COUNT(tasks.id) AS count\
			FROM tasks\
			LEFT JOIN users AS resource_users ON resource_users.id = tasks.resource_user\
			LEFT JOIN stakes AS resource_stakes ON resource_stakes.id = resource_users.stake\
			LEFT JOIN users AS need_users ON need_users.id = tasks.need_user\
			LEFT JOIN stakes AS need_stakes ON need_stakes.id = need_users.stake\
			WHERE resource_users.stake != need_users.stake\
				AND resource_stakes.region = need_stakes.region")
		.one(region_tasks)

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
				AND tasks.completed != ''")
		.one(region_tasks_completed)

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
				AND tasks.cancelled != ''")
		.one(region_tasks_cancelled)

	const storehouse_tasks = new DynamicModel({ "count": 0 })
	$app.dao().db()
		.newQuery("SELECT COUNT(tasks.id) AS count\
			FROM tasks\
			LEFT JOIN users AS resource_users ON resource_users.id = tasks.resource_user\
			LEFT JOIN stakes AS resource_stakes ON resource_stakes.id = resource_users.stake\
			LEFT JOIN users AS need_users ON need_users.id = tasks.need_user\
			LEFT JOIN stakes AS need_stakes ON need_stakes.id = need_users.stake\
			WHERE resource_stakes.region != need_stakes.region")
		.one(storehouse_tasks)

	const storehouse_tasks_completed = new DynamicModel({ "count": 0 })
	$app.dao().db()
		.newQuery("SELECT COUNT(tasks.id) AS count\
			FROM tasks\
			LEFT JOIN users AS resource_users ON resource_users.id = tasks.resource_user\
			LEFT JOIN stakes AS resource_stakes ON resource_stakes.id = resource_users.stake\
			LEFT JOIN users AS need_users ON need_users.id = tasks.need_user\
			LEFT JOIN stakes AS need_stakes ON need_stakes.id = need_users.stake\
			WHERE resource_stakes.region != need_stakes.region\
				AND tasks.completed != ''")
		.one(storehouse_tasks_completed)

	const storehouse_tasks_cancelled = new DynamicModel({ "count": 0 })
	$app.dao().db()
		.newQuery("SELECT COUNT(tasks.id) AS count\
			FROM tasks\
			LEFT JOIN users AS resource_users ON resource_users.id = tasks.resource_user\
			LEFT JOIN stakes AS resource_stakes ON resource_stakes.id = resource_users.stake\
			LEFT JOIN users AS need_users ON need_users.id = tasks.need_user\
			LEFT JOIN stakes AS need_stakes ON need_stakes.id = need_users.stake\
			WHERE resource_stakes.region != need_stakes.region\
				AND tasks.cancelled != ''")
		.one(storehouse_tasks_cancelled)

	const user_participation = new DynamicModel({ "count": 0 })
	$app.dao().db()
		.newQuery("SELECT COUNT(DISTINCT id) AS count\
			FROM (\
				SELECT resource_user AS id FROM tasks\
				WHERE resource_confirmed = true\
				UNION\
				SELECT need_user AS id FROM tasks\
					WHERE completed != ''\
						OR cancelled != ''\
			)")
		.one(user_participation)

	c.json(200, {
		"multiple_tasks": {
			"count": multiple_tasks.length,
			"description": "Items that were used in more than one task",
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
					"failure": Math.round((stake_tasks_cancelled.count / stake_tasks.count) * 100) + "%"
				},
				"region": {
					"total": region_tasks.count,
					"completed": region_tasks_completed.count,
					"cancelled": region_tasks_cancelled.count,
					"pending": region_tasks.count - region_tasks_completed.count - region_tasks_cancelled.count,
					"success": Math.round((region_tasks_completed.count / region_tasks.count) * 100) + "%",
					"failure": Math.round((region_tasks_cancelled.count / region_tasks.count) * 100) + "%",
				},
				"storehouse": {
					"total": storehouse_tasks.count,
					"completed": storehouse_tasks_completed.count,
					"cancelled": storehouse_tasks_cancelled.count,
					"pending": storehouse_tasks.count - storehouse_tasks_completed.count - storehouse_tasks_cancelled.count,
					"success": Math.round((storehouse_tasks_completed.count / storehouse_tasks.count) * 100) + "%",
					"failure": Math.round((storehouse_tasks_cancelled.count / storehouse_tasks.count) * 100) + "%",
				},
			}
		},
		"user_participation": {
			"description": "The number of users with evidence of participation in the exercise",
			"report": user_participation.count
		}
	})
})