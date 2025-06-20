/// <reference path="../pb_data/types.d.ts" />

// admin page
routerAdd("GET", "/admin", (e) => {
	// check if the user is logged in
	const user = e.hasSuperuserAuth()
	if (!user) {
		// redirect to login page
		return e.redirect(302, "/admin/login")
	}

	// load the admin page
	const html = $template.loadFiles(
		`${__hooks}/views/base.html`,
		`${__hooks}/views/admin/home.html`,
	).render({
		"appURL": $app.settings().meta.appURL,
	})

	return e.html(200, html)
})

// admin login page
routerAdd("GET", "/admin/login", (e) => {
	const html = $template.loadFiles(
		`${__hooks}/views/base.html`,
		`${__hooks}/views/admin/login.html`,
	).render({
		"appURL": $app.settings().meta.appURL,
	})

	return e.html(200, html)
})

// add/edit exercise page
routerAdd("GET", "/admin/exercise/{id}", (e) => {
	// check if the user is logged in
	const user = e.hasSuperuserAuth()
	if (!user) {
		// redirect to login page
		return e.redirect(302, "/admin/login")
	}

	// parse the exercise ID from the URL
	const id = e.request.pathValue("id")
	if (!id) {
		// redirect to the admin page
		return e.redirect(302, "/admin")
	}

	// load the admin page
	const html = $template.loadFiles(
		`${__hooks}/views/base.html`,
		`${__hooks}/views/admin/exercise.html`,
	).render({
		"appURL": $app.settings().meta.appURL,
		"pgTitle": id === "new" ? "New Exercise" : "Edit Exercise",
		"id": id,
	})

	return e.html(200, html)
})