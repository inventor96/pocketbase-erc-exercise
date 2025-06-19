/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_296480334")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_7pAwO07HJU` ON `stakes` (`name`)",
      "CREATE INDEX `idx_7x4sdE8Jwz` ON `stakes` (`region`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_296480334")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_7pAwO07HJU` ON `stakes` (`name`)"
    ]
  }, collection)

  return app.save(collection)
})
