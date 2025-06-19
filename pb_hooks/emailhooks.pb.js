/// <reference path="../pb_data/types.d.ts" />

onMailerRecordAuthAlertSend((e) => {
	// don't send the email
	console.log("Skipping auth alert email")
	return;
})