/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/monitordata", function (c) {
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

	// build participant data
	const participant_data = arrayOf(new DynamicModel({
		"name": "",
		"participants": 0,
	}))
	$app.dao().db()
		.newQuery("SELECT regions.name AS name, COUNT(DISTINCT users.id) AS participants\
			FROM tasks\
			LEFT JOIN users ON tasks.resource_user = users.id\
			LEFT JOIN stakes ON users.stake = stakes.id\
			LEFT JOIN regions ON stakes.region = regions.id\
			WHERE tasks.created BETWEEN {:start} AND {:end}\
			GROUP BY regions.name\
			ORDER BY regions.name")
		.bind({
			"start": reporting_exercise.start,
			"end": reporting_exercise.end
		})
		.all(participant_data)
	const total_participants = participant_data.reduce((acc, region) => acc + region.participants, 0)

	// count of open tasks with the need and resource being in the same stake
	const stake_tasks_open = new DynamicModel({ "count": 0 })
	$app.dao().db()
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

	// count of open tasks with the need and resource being in the same region (excluding stake)
	const region_tasks_open = new DynamicModel({ "count": 0 })
	$app.dao().db()
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

	// count of open tasks with the need and resource NOT in the same region (i.e. storehouse)
	const storehouse_tasks_open = new DynamicModel({ "count": 0 })
	$app.dao().db()
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

	// output
	c.json(200, {
		"participants": {
			"by_region": participant_data,
			"total": total_participants,
		},
		"tasks": {
			"scope": {
				"stake": {
					"open": stake_tasks_open.count,
					"fulfilled": stake_tasks_completed.count,
					"skipped": stake_tasks_cancelled.count,
				},
				"region": {
					"open": region_tasks_open.count,
					"fulfilled": region_tasks_completed.count,
					"skipped": region_tasks_cancelled.count,
				},
				"storehouse": {
					"open": storehouse_tasks_open.count,
					"fulfilled": storehouse_tasks_completed.count,
					"skipped": storehouse_tasks_cancelled.count,
				},
			},
			"total": {
				"open": stake_tasks_open.count + region_tasks_open.count + storehouse_tasks_open.count,
				"fulfilled": stake_tasks_completed.count + region_tasks_completed.count + storehouse_tasks_completed.count,
				"skipped": stake_tasks_cancelled.count + region_tasks_cancelled.count + storehouse_tasks_cancelled.count,
			}
		},
	})
})