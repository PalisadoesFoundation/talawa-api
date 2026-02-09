import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	disconnect,
	ensureBootstrapData,
	insertCollections,
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
	| "recurring_event_templates"
	| "event_volunteers"
	| "event_volunteer_memberships"
	| "action_items"
	| "tag_folders"
	| "tags"
	| "tag_assignments"
	| "notification_templates";

export async function main(): Promise<void> {
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
		"recurring_event_templates",
		"event_volunteers",
		"event_volunteer_memberships",
		"action_items",
		"tag_folders",
		"tags",
		"tag_assignments",
		"notification_templates",
	];

	try {
		await pingDB();
		console.log("\n\x1b[32mSuccess:\x1b[0m Database connected successfully\n");

		await ensureBootstrapData();
		console.log(
			"\n\x1b[32mSuccess:\x1b[0m Bootstrap data validated successfully\n",
		);

		await insertCollections(collections);
		console.log("\n\x1b[32mSuccess:\x1b[0m Sample Data added to the database");
	} catch (error: unknown) {
		throw new Error(`Database bootstrap or sample data load failed: ${error}`);
	}

	return;
}

/**
 * CLI runner: runs main(), then disconnect(). Returns exit code (0 = success, 1 = failure).
 * Extracted for testability so tests can assert on exit code without invoking process.exit().
 */
export async function run(): Promise<number> {
	try {
		await main();
	} catch (error: unknown) {
		console.error("Error running sample data script:", error);
		return 1;
	}

	try {
		await disconnect();
		console.log(
			"\n\x1b[32mSuccess:\x1b[0m Gracefully disconnecting from the database\n",
		);
		return 0;
	} catch (error: unknown) {
		console.error("Error running sample data script:", error);
		return 1;
	}
}

const scriptPath = fileURLToPath(import.meta.url);
export const isMain =
	process.argv[1] && path.resolve(process.argv[1]) === path.resolve(scriptPath);

if (isMain) {
	run().then((exitCode) => process.exit(exitCode));
}
