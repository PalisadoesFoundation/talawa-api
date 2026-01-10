import {
	askUserToContinue,
	disconnect,
	emptyMinioBucket,
	formatDatabase,
	insertCollections,
	listSampleData,
	pingDB,
} from "./helpers";

type Collection =
	| "users"
	| "organizations"
	| "organization_memberships"
	| "posts"
	| "post_votes"
	| "post_attachments"
	| "comments"
	| "membership_requests"
	| "comment_votes"
	| "action_categories"
	| "events"
	| "recurring_events"
	| "recurrence_rules"
	| "event_attendees" // 🟢 Added
	| "event_volunteers"
	| "event_volunteer_memberships"
	| "action_items"
	| "notification_templates";

const collections: Collection[] = [
	"users",
	"organizations",
	"organization_memberships",
	"posts",
	"post_votes",
	"post_attachments",
	"comments",
	"membership_requests",
	"comment_votes",
	"action_categories",
	"events",
	"recurring_events",
	"recurrence_rules",
	"event_attendees", // 🟢 Added
	"event_volunteers",
	"event_volunteer_memberships",
	"action_items",
	"notification_templates",
];

async function main() {
	let connectionSuccessful = false;

	console.log(
		`\x1b[33m\n⚠ WARNING: This script will delete all data in your database and MinIO bucket.\x1b[0m`,
	);

	const userConfirmed = await askUserToContinue(
		"Are you sure you want to proceed?",
	);

	if (!userConfirmed) {
		console.log("\x1b[31mOperation cancelled by user.\x1b[0m");
		process.exit(0);
	}

	try {
		connectionSuccessful = await pingDB();
		if (connectionSuccessful) {
			console.log("\n\x1b[32mSuccess: Database connected successfully\x1b[0m");
		}

		await formatDatabase();
		await emptyMinioBucket();
		await insertCollections(collections);

		console.log(
			"\n\x1b[32mSuccess: Sample Data added to the database\x1b[0m\n",
		);
	} catch (error) {
		console.error(`\x1b[31mError: ${error}\x1b[0m`);
		process.exit(1);
	} finally {
		if (connectionSuccessful) {
			await disconnect();
			console.log(
				"\x1b[32mSuccess: Gracefully disconnecting from the database\x1b[0m\n",
			);
		}
	}
}

main();
