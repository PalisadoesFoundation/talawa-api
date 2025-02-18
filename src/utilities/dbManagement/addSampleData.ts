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
		console.error(
			"\n\x1b[31mAdministrator access may be lost, try reimporting sample DB to restore access\x1b[0m\n",
		);
	}

	try {
		await insertCollections(collections);
		console.log("\n\x1b[32mSuccess:\x1b[0m Sample Data added to the database");
	} catch (error) {
		console.error("Error: ", error);
	}

	try {
		await disconnect();
		console.log(
			"\n\x1b[32mSuccess:\x1b[0m Gracefully disconnecting from the database\n",
		);
	} catch (error) {
		console.error("Error: ", error);
	}

	process.exit(0);
}

await main();
