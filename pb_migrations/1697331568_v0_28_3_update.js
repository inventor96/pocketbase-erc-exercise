/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  app.db().newQuery("INSERT INTO `_migrations` (`applied`, `file`) VALUES\
	(1750298328, '1750298328_created_exercises.js'),\
	(1750298549, '1750298549_created_items.js'),\
	(1750298646, '1750298646_created_regions.js'),\
	(1750298742, '1750298742_created_stakes.js'),\
	(1750299034, '1750299034_created_tasks.js'),\
	(1750304452, '1750304452_updated_users.js'),\
	(1750304496, '1750304496_updated_users.js'),\
	(1750304728, '1750304728_updated_stakes.js'),\
	(1750304767, '1750304767_updated_tasks.js'),\
	(1750320802, '1750320802_updated_stakes.js')")
  	.execute()
}, (db) => {
  return null
})
