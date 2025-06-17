/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);

  const settings = dao.findSettings()
  settings.meta.appName = "ERC Exercise"
  settings.meta.senderName = "ERC Exercise"

  dao.saveSettings(settings)
}, (db) => {
  return null
})
