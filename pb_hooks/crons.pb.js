/// <reference path="../pb_data/types.d.ts" />

cronAdd("check-unconfirmed-tasks", "* * * * *", () => {
	// get all unconfirmed resources that haven't been updated in at least 130 seconds
	const report = []
	const unconfirmed_tasks = $app.findAllRecords("tasks",
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

	// mark them as rejected and add them to a report
	unconfirmed_tasks.forEach(task => {
		report.push({
			task_id: task.id,
			prev_resource_user: task.get('resource_user')
		})
		task.set('resource_rejected', true)
		$app.save(task)
	})

	// return the report if there are any tasks
	const l = $app.logger().withGroup('check-unconfirmed-tasks')
	if (report.length > 0) {
		l.info(`${report.length} unconfirmed tasks found and marked as rejected.`, 'report', report)
	} else {
		l.info("No unconfirmed tasks found.")
	}
})