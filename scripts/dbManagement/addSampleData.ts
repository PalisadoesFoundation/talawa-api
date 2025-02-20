import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	disconnect,
	ensureAdministratorExists,
	insertCollections,
	pingDB,
} from "./helpers";

export async function main(): Promise<void> {
	const collections = ["users", "organizations", "organization_memberships"];

	try {
		await pingDB();
		console.log("\n\x1b[32mSuccess:\x1b[0m Database connected successfully\n");
	} catch (error) {
		throw new Error(`Database connection failed: ${error}`);
	}
	try {
		await ensureAdministratorExists().then(() => {
			console.log("\x1b[32mSuccess:\x1b[0m Administrator setup complete\n");
		});
	} catch (error) {
		console.error("\nError: Administrator creation failed", error);
		throw new Error(
			"\n\x1b[31mAdministrator access may be lost, try reimporting sample DB to restore access\x1b[0m\n",
		);
	}

	try {
		await insertCollections(collections);
		console.log("\n\x1b[32mSuccess:\x1b[0m Sample Data added to the database");
	} catch (error) {
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
		} catch (error) {
			exitCode = 1;
		}
		try {
			await disconnect();
			console.log(
				"\n\x1b[32mSuccess:\x1b[0m Gracefully disconnecting from the database\n",
			);
		} catch (error) {
			console.error("Error: Cannot disconnect", error);
			exitCode = 1;
		} finally {
			process.exit(exitCode);
		}
	})();
}
