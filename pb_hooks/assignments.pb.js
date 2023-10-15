onModelBeforeUpdate((e) => {
	const table = e.model.tableName()
	const current_model = $app.dao().findRecordById(table, e.model.id)
	var user_ids = []
	var exercise_record

	// setup based on table
	if (table == 'users') {
		/**
		 * LIVE DEBUGGING
		 */
		/* if (e.model.get('callsign') != 'KF7CVT2') {
			return
		} */
	
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
	const id_model = new DynamicModel({ "id": "" })
	const stake_weight = exercise_record.get('stake_distribution')
	const region_weight = exercise_record.get('region_distribution')
	const storehouse_weight = exercise_record.get('storehouse_distribution')
	const tasks_collection = $app.dao().findCollectionByNameOrId("tasks")

	// loop through processing list
	user_ids.forEach(user_id => {
		var eligible_users = [];
		var user_model = $app.dao().findRecordById('users', user_id)

		// build list of eligible resource users from the stake
		var stake_users = arrayOf(id_model)
		$app.dao().db()
			.select('users.id')
			.from('users')
			.where($dbx.exp("stake = {:stake} AND id != {:id}", {
				stake: user_model.get('stake'),
				id: user_id
			}))
			.all(stake_users)
		stake_users.forEach(stake_user => {
			eligible_users.push({
				id: stake_user.id,
				weight: stake_weight
			})
		})
	
		// build list of eligible resource users from the region
		var region_id = $app.dao().findRecordById("stakes", user_model.get('stake')).get('region')
		var region_users = arrayOf(new DynamicModel({ "id": "" }))
		$app.dao().db()
			.select('users.id')
			.from('users')
			.leftJoin('stakes', $dbx.exp("users.stake = stakes.id"))
			.where($dbx.exp("stakes.region = {:region} AND users.stake != {:stake}", {
				region: region_id,
				stake: user_model.get('stake')
			}))
			.all(region_users)
		region_users.forEach(region_user => {
			eligible_users.push({
				id: region_user.id,
				weight: region_weight
			})
		})
	
		// build list of eligible resource users from the region
		var storehouse_users = arrayOf(new DynamicModel({ "id": "" }))
		$app.dao().db()
			.select('users.id')
			.from('users')
			.leftJoin('stakes', $dbx.exp("users.stake = stakes.id"))
			.where($dbx.exp("stakes.region != {:region}", {
				region: region_id
			}))
			.all(storehouse_users)
		storehouse_users.forEach(storehouse_user => {
			eligible_users.push({
				id: storehouse_user.id,
				weight: storehouse_weight
			})
		})
	
		// shuffle list
		const weight_max = (stake_users.length * stake_weight)
			+ (region_users.length * region_weight)
			+ (storehouse_users.length * storehouse_weight)
		for (var i = eligible_users.length - 1; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1));
			var temp = eligible_users[i];
			eligible_users[i] = eligible_users[j];
			eligible_users[j] = temp;
		}
	
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
					.newQuery("SELECT id\
						FROM items\
						ORDER BY RANDOM()\
						LIMIT 1;")
					.one(task)
		
				// pick random resource user
				var pointer = Math.random() * weight_max
				var weight_sum = 0
				var ii = 0
				while (weight_sum < pointer && ii < eligible_users.length) {
					weight_sum = weight_sum + eligible_users[ii].weight
					ii++
				}
				var resource_user = eligible_users[ii - 1].id
		
				// create task
				$app.dao().saveRecord(new Record(tasks_collection, {
					"need_user": user_id,
					"resource_user": resource_user,
					"item": task.id,
					"resource_confirmed": false
				}))
			}
		} else if (table == 'tasks') {
			// pick random resource user
			var pointer = Math.random() * weight_max
			var weight_sum = 0
			var ii = 0
			while (weight_sum < pointer && ii < eligible_users.length) {
				weight_sum = weight_sum + eligible_users[ii].weight
				ii++
			}
			var resource_user = eligible_users[ii - 1].id

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