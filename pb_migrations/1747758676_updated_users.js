/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("users")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "eiouewbo",
    "name": "name",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("users")

  // remove
  collection.schema.removeField("eiouewbo")

  return dao.saveCollection(collection)
})
