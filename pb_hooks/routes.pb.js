/// <reference path="../pb_data/types.d.ts" />

// log all requests
routerUse($apis.activityLogger($app))

// set cookie on successful auth request
onRecordAuthRequest((e) => {
	e.httpContext.response().header().set('Set-Cookie', `token=${e.token}; Path=/; HttpOnly; SameSite=Lax; ${e.httpContext.scheme() === 'https' ? 'Secure' : ''}`)
})

// clear cookie on logout
routerAdd("GET", "/logout", (c) => {
	c.response().header().set('Set-Cookie', `token=; Path=/; HttpOnly; SameSite=Lax; ${c.scheme() === 'https' ? 'Secure' : ''}`)
	return c.redirect(302, "/login")
})

// cookie authentication middleware
function cookieAuth(next) {
	return (c) => {
		// skip cookie processing if already authenticated
		if (c.get('authRecord')) {
			return next(c)
		}

		// get the auth token from the cookie
		const header = c.request().header.get('Cookie')
		if (!header) {
			// no record
			return next(c)
		}
		const cookies = header.split('; ')
		const token = cookies.find(cookie => cookie.startsWith('token='))
		if (!token) {
			// no record
			return next(c)
		}
		const tokenValue = token.split('=')[1]
		if (!tokenValue) {
			// no record
			return next(c)
		}

		// set the auth record in the context
		let user = null
		try {
			user = $app.dao().findAuthRecordByToken(tokenValue, $app.settings().recordAuthToken.secret)
			if (user) {
				c.set('authRecord', user)
			}
		} catch (err) { /* no user. maybe admin? */}

		return next(c)
	}
}
routerUse(cookieAuth)

// render home page
routerAdd("GET", "/", (c) => {
	// redirect to login page if not logged in
	if (!c.get('authRecord')) {
		return c.redirect(302, "/login")
	}

	// render the home page
	const html = $template.loadFiles(
		`${__hooks}/views/base.html`,
		`${__hooks}/views/home.html`,
	).render({
		"appUrl": $app.settings().meta.appUrl,
	})

	return c.html(200, html)
})

// handle need fulfillment verification
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

// render the signup page
routerAdd("GET", "/signup", (c) => {
	// redirect to home if already logged in
	if (c.get('authRecord')) {
		return c.redirect(302, "/")
	}

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

// get a random callsign
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

// render the login page
routerAdd("GET", "/login", (c) => {
	// redirect to home if already logged in
	if (c.get('authRecord')) {
		return c.redirect(302, "/")
	}

	// render the login page
	const html = $template.loadFiles(
		`${__hooks}/views/base.html`,
		`${__hooks}/views/login.html`,
	).render({
		"appUrl": $app.settings().meta.appUrl,
	})

	return c.html(200, html)
})

// render monitor page
routerAdd("GET", "/monitor", (c) => {
	const html = $template.loadFiles(
		`${__hooks}/views/monitor.html`,
	).render({
		"appUrl": $app.settings().meta.appUrl,
	})

	return c.html(200, html)
})

// cron job to handle unconfirmed tasks
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