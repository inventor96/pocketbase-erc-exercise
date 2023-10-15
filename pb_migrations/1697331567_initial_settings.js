/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);

  const settings = dao.findSettings()
  settings.meta.appName = "ERC Exercise"
  settings.meta.appUrl = "https://exercise.idahoerc.org"

  dao.saveSettings(settings)
}, (db) => {
  return null
})
