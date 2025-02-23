import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	askUserToContinue,
	disconnect,
	emptyMinioBucket,
	ensureAdministratorExists,
	formatDatabase,
	pingDB,
} from "./helpers";

export async function main(): Promise<void> {
	const deleteExisting = await askUserToContinue(
		"\x1b[31m Warning:\x1b[0m This will delete all data in the database. Are you sure you want to continue?",
	);

	if (deleteExisting) {
		try {
			await pingDB();
			console.log(
				"\n\x1b[32mSuccess:\x1b[0m Database connected successfully\n",
			);
		} catch (error: unknown) {
			throw new Error(`Database connection failed: ${error}`);
		}
		try {
			await formatDatabase();
			console.log("\n\x1b[32mSuccess:\x1b[0m Database formatted successfully");
		} catch (error: unknown) {
			console.error(
				"\n\x1b[31mError: Database formatting failed\n\x1b[0m",
				error,
			);
			console.error("\n\x1b[33mRolled back to previous state\x1b[0m");
			console.error("\n\x1b[33mPreserving administrator access\x1b[0m");
		}
		try {
			await emptyMinioBucket();
			console.log("\x1b[32mSuccess:\x1b[0m Bucket formatted successfully\n");
		} catch (error: unknown) {
			console.error(
				"\n\x1b[31mError: Bucket formatting failed\n\x1b[0m",
				error,
			);
		}
		try {
			await ensureAdministratorExists();
			console.log("\x1b[32mSuccess:\x1b[0m Administrator access restored\n");
		} catch (error: unknown) {
			console.error("\nError: Administrator creation failed", error);
			console.error(
				"\n\x1b[31mAdministrator access may be lost, try reformatting DB to restore access\x1b[0m\n",
			);
		}
	} else {
		console.log("Operation cancelled");
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
