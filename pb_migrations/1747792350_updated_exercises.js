/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("exercises")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "tpa6kj0o",
    "name": "initial_assignments",
    "type": "number",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": 1,
      "max": null,
      "noDecimal": true
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "l12zbls0",
    "name": "subsequent_assignments",
    "type": "number",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": 1,
      "max": null,
      "noDecimal": true
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("9k67dzf3isudpv3")

  // remove
  collection.schema.removeField("tpa6kj0o")

  // remove
  collection.schema.removeField("l12zbls0")

  return dao.saveCollection(collection)
})
