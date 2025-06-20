/// <reference path="../pb_data/types.d.ts" />

onMailerRecordAuthAlertSend((e) => {
	// don't send the email
	$app.logger().info("Skipping auth alert email")
	return;
})