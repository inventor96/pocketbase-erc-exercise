routerAdd("GET", "/", (c) => {
	const html = $template.loadFiles(
		`${__hooks}/views/base.html`,
		`${__hooks}/views/home.html`,
	).render()

	return c.html(200, html)
})

routerAdd("POST", "/fulfill-need", (c) => {
	// get data
	const user = c.get('authRecord')
	const data = $apis.requestInfo(c).data
	const task = $app.dao().findRecordById("tasks", data.need_id)

	// require correct user
	if (task.getString('need_user') != user.id) {
		throw new UnauthorizedError('You look familiar, but not who we were expecting...')
	}

	// check callsign
	$app.dao().expandRecord(task, ["resource_user"], null)
	const result = data.need_callsign == task.expandedOne('resource_user').getString('callsign')

	// update the task if successful
	if (result) {
		task.set('completed', new Date().toISOString().replace('T', ' ').substr(0, 19))
		$app.dao().saveRecord(task)
	}

	return c.json(200, {"success": result})
}, $apis.requireRecordAuth())

routerAdd("GET", "/signup", (c) => {
	const result = arrayOf(new DynamicModel({
		"id": "",
		"name": "",
	}))

	$app.dao().db()
		.select("id", "name")
		.from("stakes")
		.orderBy("name")
		.all(result)

	const html = $template.loadFiles(
		`${__hooks}/views/base.html`,
		`${__hooks}/views/signup.html`,
	).render({
		"stakes": result,
	})

	return c.html(200, html)
})

routerAdd("GET", "/callsign", (c) => {
	// generate a unique callsign
	var callsign;
	do {
		var rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
		callsign = `ERC${rand}`
		var exists = false
		try {
			$app.dao().findFirstRecordByData("users", "callsign", callsign)
			exists = true
		} catch (err) {
			if (err.toString().includes('no rows in result set')) {
				exists = false
			} else {
				throw err
			}
		}
	} while (exists)
	return c.json(200, {"callsign": callsign})
})

routerAdd("GET", "/login", (c) => {
	const html = $template.loadFiles(
		`${__hooks}/views/base.html`,
		`${__hooks}/views/login.html`,
	).render()

	return c.html(200, html)
})

routerAdd("GET", "/check-unconfirmed-tasks", (c) => {
	// get all unconfirmed resources that haven't been updated in at least 130 seconds
	const report = []
	const unconfirmed_tasks = $app.dao().findRecordsByExpr("tasks",
		$dbx.hashExp({
			completed: "",
			cancelled: "",
			resource_confirmed: false,
			resource_rejected: false
		}),
		$dbx.exp(
			'updated < {:reftime}',
			{ "reftime": new Date(Date.now() - 130000).toISOString().replace('T', ' ').substr(0, 19) }
		)
	)
	unconfirmed_tasks.forEach(task => {
		report.push({
			task_id: task.id,
			prev_resource_user: task.get('resource_user')
		})
		task.set('resource_rejected', true)
		$app.dao().saveRecord(task)
	})
	if (report.length > 0) {
		return c.json(200, report)
	} else {
		return c.noContent(204)
	}
})

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