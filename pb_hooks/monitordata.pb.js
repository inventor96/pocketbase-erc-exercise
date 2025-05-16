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

	// output
	c.json(200, {
		"participants": {
			"by_region": participant_data,
			"total": total_participants,
		},
	})
})