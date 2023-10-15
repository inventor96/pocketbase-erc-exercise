/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("0ivoml3p0vpnis8")

  collection.indexes = [
    "CREATE INDEX `idx_S8L7PVS` ON `tasks` (`resource_user`)",
    "CREATE INDEX `idx_XThDWuS` ON `tasks` (`need_user`)",
    "CREATE INDEX `idx_2CUIm9T` ON `tasks` (`item`)"
  ]

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("0ivoml3p0vpnis8")

  collection.indexes = [
    "CREATE INDEX `idx_S8L7PVS` ON `tasks` (`resource_user`)",
    "CREATE INDEX `idx_XThDWuS` ON `tasks` (`need_user`)"
  ]

  return dao.saveCollection(collection)
})
