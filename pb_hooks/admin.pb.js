/// <reference path="../pb_data/types.d.ts" />

// set cookie on successful auth request
onAdminAuthRequest((e) => {
	e.httpContext.response().header().set('Set-Cookie', `token=${e.token}; Path=/; HttpOnly; SameSite=Lax; ${e.httpContext.scheme() === 'https' ? 'Secure' : ''}`)
})

// admin page
routerAdd("GET", "/admin", (c) => {
	// check if the user is logged in
	const user = c.get('admin')
	if (!user) {
		// redirect to login page
		return c.redirect(302, "/admin/login")
	}

	// load the admin page
	const html = $template.loadFiles(
		`${__hooks}/views/base.html`,
		`${__hooks}/views/admin/home.html`,
	).render({
		"appUrl": $app.settings().meta.appUrl,
	})

	return c.html(200, html)
})

// admin login page
routerAdd("GET", "/admin/login", (c) => {
	const html = $template.loadFiles(
		`${__hooks}/views/base.html`,
		`${__hooks}/views/admin/login.html`,
	).render({
		"appUrl": $app.settings().meta.appUrl,
	})

	return c.html(200, html)
})