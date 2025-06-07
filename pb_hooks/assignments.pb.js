/// <reference path="../pb_data/types.d.ts" />

onModelBeforeUpdate((e) => {
	const table = e.model.tableName()
	const current_model = $app.dao().findRecordById(table, e.model.id)
	var user_ids = []
	var exercise_record
	var old_resource_user_id = ''

	// setup based on table
	if (table == 'users') {
		// only go through this process if the user is being updated from ready:false to ready:true
		if (current_model.get('ready') == true || e.model.get('ready') == false) {
			return
		}

		// check if there's an active exercise
		try {
			exercise_record = $app.dao().findFirstRecordByFilter(
				"exercises",
				"started = true && end > {:now}", // omiting the start so admins can start early if desired
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
		// reset user rejection count if they confirm the resource
		if (current_model.get('resource_confirmed') == false && e.model.get('resource_confirmed') == true) {
			const confirmed_resource_user = $app.dao().findRecordById('users', e.model.get('resource_user'))
			confirmed_resource_user.set('rejected', 0)
			$app.dao().saveRecord(confirmed_resource_user)
		}

		// only go through this process if the task is being updated from resource_rejected:false to resource_rejected:true
		if (current_model.get('resource_rejected') == true || e.model.get('resource_rejected') == false) {
			return
		}

		// check if there's an active exercise
		try {
			exercise_record = $app.dao().findFirstRecordByFilter(
				"exercises",
				"started = true && end > {:now}", // omiting the start so admins can start early if desired
				{ now: new Date().toISOString().replace('T', ' ').substr(0, 19) }
			)
		} catch (error) { /* no active exercises */}

		// stop if there's no active exercise
		if (exercise_record == undefined) {
			return
		}

		// update resource user rejection count
		old_resource_user_id = e.model.get('resource_user')
		const old_resource_user = $app.dao().findRecordById('users', old_resource_user_id)
		old_resource_user.set('rejected', old_resource_user.getInt('rejected') + 1)
		$app.dao().saveRecord(old_resource_user)

		// only have the need_user to work with
		user_ids.push(e.model.get('need_user'))
	} else {
		// some programmer made a boo boo
		throw new ApiError(500, "Unhandled table")
	}

	// shoring up
	const tasks_collection = $app.dao().findCollectionByNameOrId("tasks")
	const stake_weight = exercise_record.get('stake_distribution')
	const region_weight = exercise_record.get('region_distribution')
	const storehouse_weight = exercise_record.get('storehouse_distribution')
	const scope_total = stake_weight + region_weight + storehouse_weight
	const initial_assignments = exercise_record.get('initial_assignments')
	const subsequent_assignments = exercise_record.get('subsequent_assignments')

	function chooseUser(user_id) {
		const resource_user = new DynamicModel({ "id": "" })
		const user_model = $app.dao().findRecordById('users', user_id)
		const region_id = $app.dao().findRecordById("stakes", user_model.get('stake')).get('region')
		var skip_stake = false,
			skip_region = false,
			skip_storehouse = false

		// find resource user
		do {
			// choose random scope
			var scope_chooser = Math.random() * scope_total
			if (scope_chooser <= stake_weight && !skip_stake) {
				try {
					// get user from the stake
					$app.dao().db()
						.newQuery("SELECT users.id, COUNT(tasks.id) AS count\
							FROM users\
							LEFT JOIN tasks ON tasks.resource_user = users.id\
							WHERE users.stake = {:stake}\
								AND users.id != {:id}\
								AND users.rejected < 3\
								AND users.id != {:prev_user}\
							GROUP BY users.id\
							ORDER BY count ASC, RANDOM()\
							LIMIT 1")
						.bind({
							stake: user_model.get('stake'),
							id: user_id,
							prev_user: old_resource_user_id
						})
						.one(resource_user)
				} catch (err) {
					// no stake user available
					console.log('Could not find a resource user in the stake:', err)
					skip_stake = true
				}
			} else if (scope_chooser <= region_weight + stake_weight && !skip_region) {
				try {
					// get user from the region
					$app.dao().db()
						.newQuery("SELECT users.id, COUNT(tasks.id) AS count\
							FROM users\
							LEFT JOIN tasks ON tasks.resource_user = users.id\
							LEFT JOIN stakes on stakes.id = users.stake\
							WHERE stakes.region = {:region}\
								AND users.stake != {:stake}\
								AND users.rejected < 3\
								AND users.id != {:prev_user}\
							GROUP BY users.id\
							ORDER BY count ASC, RANDOM()\
							LIMIT 1")
						.bind({
							region: region_id,
							stake: user_model.get('stake'),
							prev_user: old_resource_user_id
						})
						.one(resource_user)
				} catch (err) {
					// no region user available
					console.log('Could not find a resource user in the region:', err)
					skip_region = true
				}
			} else if (!skip_storehouse) {
				try {
					// get user from the storehouse
					$app.dao().db()
						.newQuery("SELECT users.id, COUNT(tasks.id) AS count\
							FROM users\
							LEFT JOIN tasks ON tasks.resource_user = users.id\
							LEFT JOIN stakes on stakes.id = users.stake\
							WHERE stakes.region != {:region}\
								AND users.rejected < 3\
								AND users.id != {:prev_user}\
							GROUP BY users.id\
							ORDER BY count ASC, RANDOM()\
							LIMIT 1")
						.bind({
							region: region_id,
							prev_user: old_resource_user_id
						})
						.one(resource_user)
				} catch (err) {
					// no storehouse user available
					console.log('Could not find a resource user in the storehouse:', err)
					skip_storehouse = true
				}
			} else {
				// nobody is available!
				break
			}
		} while (!resource_user.id && (!skip_stake || !skip_region || !skip_storehouse))

		// sanity check to make sure there's enough users
		if (!resource_user.id) {
			console.error("chooseUser() logic error! There doesn't seem to be any other users available to use as the resource user!")
			throw new ApiError(500, 'Unable to find a resource user!')
		}

		return resource_user.id
	}

	// loop through processing list
	user_ids.forEach(user_id => {
		// create or update based on update type
		if (table == 'users' || table == 'exercises') {
			// check users existing tasks
			var tasks = new DynamicModel({ "count": 0 })
			$app.dao().db()
				.newQuery("SELECT COUNT(id) AS count\
					FROM tasks\
					WHERE need_user = {:need_user}\
						AND created > {:start}\
						AND created < {:end}")
				.bind({
					"need_user": user_id,
					"start": exercise_record.get('start'),
					"end": exercise_record.get('end')
				})
				.one(tasks)

			// create multiple tasks based on previous task count
			var new_task_count = tasks.count > 0 ? subsequent_assignments : initial_assignments
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
			throw new ApiError(500, "Unhandled table")
		}
	})
}, 'users', 'tasks', 'exercises')

onModelBeforeCreate((e) => {
	// prevent new exercises from being created as already started
	e.model.set('started', false)
}, 'exercises')

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