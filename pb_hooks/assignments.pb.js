onModelBeforeUpdate((e) => {
	const table = e.model.tableName()
	const current_model = $app.dao().findRecordById(table, e.model.id)
	var user_ids = []
	var exercise_record

	// setup based on table
	if (table == 'users') {
		// only go through this process if the user is being updated from ready:false to ready:true
		if (current_model.get('ready') != false || e.model.get('ready') != true) {
			return
		}

		// check if there's an active exercise
		try {
			exercise_record = $app.dao().findFirstRecordByFilter(
				"exercises",
				"started = true && end > {:now}",
				{ now: new Date().toISOString().replace('T', ' ').substr(0, 19) }
			)
		} catch (error) { /* no active exercises */}

		// stop if there's no active exercise
		if (exercise_record == undefined) {
			return
		}

		// add user to processing list
		user_ids.push(e.model.id)
	} else if (table == 'exercises') {
		// only go through this process if the exercise is being updated from started:false to started:true
		if (current_model.get('started') != false || e.model.get('started') != true) {
			return
		}

		// get list of users who are already ready
		const ready_users = $app.dao().findRecordsByExpr("users", $dbx.hashExp({ready: true}))
		ready_users.forEach(ready_user => user_ids.push(ready_user.get('id')))

		exercise_record = e.model
	} else if (table == 'tasks') {
		// only go through this process if the task is being updated from resource_rejected:false to resource_rejected:true
		if (current_model.get('resource_rejected') != false || e.model.get('resource_rejected') != true) {
			return
		}

		// check if there's an active exercise
		try {
			exercise_record = $app.dao().findFirstRecordByFilter(
				"exercises",
				"started = true && end > {:now}",
				{ now: new Date().toISOString().replace('T', ' ').substr(0, 19) }
			)
		} catch (error) { /* no active exercises */}

		// stop if there's no active exercise
		if (exercise_record == undefined) {
			return
		}

		// only have the need_user to work with
		user_ids.push(e.model.get('need_user'))
	} else {
		// some programmer made a boo boo
		throw new ApiError()
	}

	// shoring up
	const tasks_collection = $app.dao().findCollectionByNameOrId("tasks")
	const stake_weight = exercise_record.get('stake_distribution')
	const region_weight = exercise_record.get('region_distribution')
	const storehouse_weight = exercise_record.get('storehouse_distribution')
	const scope_total = stake_weight + region_weight + storehouse_weight
	const items = new DynamicModel({ "count": 0 })
	$app.dao().db().newQuery("SELECT COUNT(id) AS count FROM items;").one(items)

	function chooseUser(user_id) {
		const eligible_users = arrayOf(new DynamicModel({ "id": "" }))
		const user_model = $app.dao().findRecordById('users', user_id)
		const region_id = $app.dao().findRecordById("stakes", user_model.get('stake')).get('region')

		// choose random scope
		do {
			var scope_chooser = Math.random() * scope_total,
				i = 0
			if (scope_chooser <= stake_weight) {
				// build list of eligible resource users from the stake
				$app.dao().db()
					.select('users.id')
					.from('users')
					.where($dbx.exp("stake = {:stake} AND id != {:id}", {
						stake: user_model.get('stake'),
						id: user_id
					}))
					.orderBy('users.id')
					.all(eligible_users)
			} else if (scope_chooser <= region_weight + stake_weight) {
				// build list of eligible resource users from the region
				$app.dao().db()
					.select('users.id')
					.from('users')
					.leftJoin('stakes', $dbx.exp("users.stake = stakes.id"))
					.where($dbx.exp("stakes.region = {:region} AND users.stake != {:stake}", {
						region: region_id,
						stake: user_model.get('stake')
					}))
					.orderBy('users.id')
					.all(eligible_users)
			} else {
				// build list of eligible resource users from the storehouse
				$app.dao().db()
					.select('users.id')
					.from('users')
					.leftJoin('stakes', $dbx.exp("users.stake = stakes.id"))
					.where($dbx.exp("stakes.region != {:region}", {
						region: region_id
					}))
					.orderBy('users.id')
					.all(eligible_users)
			}
		} while (eligible_users.length == 0 && i++ < 3)

		// sanity check to make sure there's enough users
		if (eligible_users.length == 0) {
			console.error("chooseUser() logic error! There doesn't seem to be any other users available to use as the resource user!")
			throw new ApiError(500, 'Unable to find a resource user!')
		}

		// pick random resource user
		const user_chooser = Math.floor(Math.random() * eligible_users.length)
		return eligible_users[user_chooser].id
	}

	// loop through processing list
	user_ids.forEach(user_id => {
		// create or update based on update type
		if (table == 'users' || table == 'exercises') {
			// check users existing tasks
			var tasks = new DynamicModel({ "count": 0 })
			$app.dao().db()
				.newQuery("SELECT COUNT(id) AS count FROM tasks WHERE need_user = {:need_user};")
				.bind({
					"need_user": user_id
				})
				.one(tasks)

			// create multiple tasks based on previous task count
			var new_task_count = tasks.count > 0 ? 1 : 3
			for (let j = 0; j < new_task_count; j++) {
				// pick a random task
				var task = new DynamicModel({ "id": "" })
				$app.dao().db()
					.newQuery('SELECT items.id, COUNT(tasks.id) AS used\
						FROM items\
						LEFT JOIN tasks ON tasks.item = items.id\
						GROUP BY items.id\
						ORDER BY used ASC, RANDOM()\
						LIMIT 1')
					.one(task)

				// pick resource user
				var resource_user = chooseUser(user_id)

				// create task
				$app.dao().saveRecord(new Record(tasks_collection, {
					"need_user": user_id,
					"resource_user": resource_user,
					"item": task.id,
					"resource_confirmed": false
				}))
			}
		} else if (table == 'tasks') {
			// pick resource user
			var resource_user = chooseUser(user_id)

			// update existing task with new user
			e.model.set('resource_user', resource_user)
			e.model.set('resource_rejected', false)
			$app.dao().saveRecord(e.model)
		} else {
			// some programmer made a boo boo
			throw new ApiError()
		}
	})
}, 'users', 'tasks', 'exercises')

onModelAfterUpdate((e) => {
	// update needs user when a task resource has been confirmed
	if (e.model.get('resource_confirmed') == true) {
		const need_user = $app.dao().findRecordById("users", e.model.get('need_user'))
		need_user.set('ready', false)
		$app.dao().saveRecord(need_user)
	}
}, 'tasks')

onModelAfterCreate((e) => {
	// update needs user when a task resource has been created as confirmed
	if (e.model.get('resource_confirmed') == true) {
		const need_user = $app.dao().findRecordById("users", e.model.get('need_user'))
		need_user.set('ready', false)
		$app.dao().saveRecord(need_user)
	}
}, 'tasks')