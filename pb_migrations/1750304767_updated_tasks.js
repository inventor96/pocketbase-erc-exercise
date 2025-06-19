/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("tasks")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_VObiopX3SF` ON `tasks` (`resource_user`)",
      "CREATE INDEX `idx_W2V260ysx9` ON `tasks` (`need_user`)",
      "CREATE INDEX `idx_Hm0L869Nqh` ON `tasks` (`item`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("tasks")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
