/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const settings = app.settings();
  settings.meta.appName = "ERC Exercise";
  settings.meta.senderName = "ERC Exercise";
}, (db) => {
  return null
})
