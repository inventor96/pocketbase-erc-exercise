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
		task.set('resource_rejected', true)
		try {
			$app.save(task)
		} catch (error) {
			$app.logger().error("Error saving task as rejected!", 'task_id', task.id, 'error', error)
			return
		}
		report.push({
			task_id: task.id,
			prev_resource_user: task.get('resource_user')
		})
	})

	// return the report if there are any tasks
	const l = $app.logger().withGroup('check-unconfirmed-tasks')
	l.info(`${report.length} unconfirmed tasks found and marked as rejected.`, 'report', report)
})