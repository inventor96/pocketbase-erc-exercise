/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users")

  // add field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "date801301603",
    "max": "",
    "min": "",
    "name": "last_reject",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("users")

  // remove field
  collection.fields.removeById("date801301603")

  return app.save(collection)
})
