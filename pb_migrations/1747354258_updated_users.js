/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("users")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "cbtmc0k8",
    "name": "comm_type",
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
  collection.schema.removeField("cbtmc0k8")

  return dao.saveCollection(collection)
})
