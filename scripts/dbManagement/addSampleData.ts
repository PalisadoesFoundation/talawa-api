import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	disconnect,
	ensureAdministratorExists,
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
	| "comment_votes";

export async function main(): Promise<void> {
	const collections: Collection[] = [
		"users",
		"organizations",
		"organization_memberships",
		"posts",
		"post_votes",
		"post_attachments",
		"comments",
		"comment_votes",
	];

	try {
		await pingDB();
		console.log("\n\x1b[32mSuccess:\x1b[0m Database connected successfully\n");
	} catch (error: unknown) {
		throw new Error(`Database connection failed: ${error}`);
	}
	try {
		await ensureAdministratorExists();
		console.log("\x1b[32mSuccess:\x1b[0m Administrator setup complete\n");
	} catch (error: unknown) {
		console.error("\nError: Administrator creation failed", error);
		throw new Error(
			"\n\x1b[31mAdministrator access may be lost, try reimporting sample DB to restore access\x1b[0m\n",
		);
	}

	try {
		await insertCollections(collections);
		console.log("\n\x1b[32mSuccess:\x1b[0m Sample Data added to the database");
	} catch (error: unknown) {
		console.error("Error: ", error);
		throw new Error("Error adding sample data");
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
