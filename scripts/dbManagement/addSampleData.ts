import path from "node:path";
import { fileURLToPath } from "node:url";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";
import { disconnect, insertCollections, pingDB } from "./helpers";

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
	| "event_volunteers"
	| "event_volunteer_memberships"
	| "action_items"
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
		"event_volunteers",
		"event_volunteer_memberships",
		"action_items",
		"notification_templates",
	];

	try {
		await pingDB();
		console.log("\n\x1b[32mSuccess:\x1b[0m Database connected successfully\n");
	} catch (error: unknown) {
		throw new TalawaRestError({
			code: ErrorCode.DATABASE_ERROR,
			message: `Database connection failed: ${error}`,
		});
	}
	try {
		await insertCollections(collections);
		console.log("\n\x1b[32mSuccess:\x1b[0m Sample Data added to the database");
	} catch (error: unknown) {
		console.error("Error: ", error);
		throw new TalawaRestError({
			code: ErrorCode.DATABASE_ERROR,
			message: "Error adding sample data",
		});
	}

	return;
}

const scriptPath = fileURLToPath(import.meta.url);
export const isMain =
	process.argv[1] && path.resolve(process.argv[1]) === path.resolve(scriptPath);

if (isMain) {
	let exitCode = 0;
	(async () => {
		try {
			await main();
		} catch (error: unknown) {
			console.error("Error: Adding sample data", error);
			exitCode = 1;
		}
		try {
			await disconnect();
			console.log(
				"\n\x1b[32mSuccess:\x1b[0m Gracefully disconnecting from the database\n",
			);
		} catch (error: unknown) {
			console.error("Error: Cannot disconnect", error);
			exitCode = 1;
		} finally {
			process.exit(exitCode);
		}
	})();
}
