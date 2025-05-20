/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("users")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "volfkp8b",
    "name": "rejected",
    "type": "number",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": 0,
      "max": null,
      "noDecimal": true
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("users")

  // remove
  collection.schema.removeField("volfkp8b")

  return dao.saveCollection(collection)
})
