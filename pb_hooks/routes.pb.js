/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/", (c) => {
	const html = $template.loadFiles(
		`${__hooks}/views/base.html`,
		`${__hooks}/views/home.html`,
	).render({
		"appUrl": $app.settings().meta.appUrl,
	})

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
		"appUrl": $app.settings().meta.appUrl,
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
	).render({
		"appUrl": $app.settings().meta.appUrl,
	})

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