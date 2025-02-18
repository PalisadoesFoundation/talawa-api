import dotenv from "dotenv";
import inquirer from "inquirer";
import {
	disconnect,
	ensureAdministratorExists,
	formatDatabase,
} from "./helpers";
//Load Environment Variables
dotenv.config();

interface PromptResult {
	deleteExisting: boolean;
}

const NODE_ENV = process.env.NODE_ENV || "development";

export async function main(): Promise<void> {
	if (NODE_ENV === "production") {
		console.error(
			"\x1b[31mRestricted: Resetting the database in production is not allowed\x1b[0m\n",
		);
		process.exit(0);
	}
	const { deleteExisting } = await inquirer.prompt<PromptResult>([
		{
			type: "confirm",
			name: "deleteExisting",
			message:
				"\x1b[31m Warning:\x1b[0m This will delete all data in the database. Are you sure you want to continue?",
			default: false,
		},
	]);

	if (deleteExisting) {
		try {
			await formatDatabase().then(() => {
				console.log(
					"\n\x1b[32mSuccess:\x1b[0m Database formatted successfully",
				);
			});
		} catch (error) {
			console.error(
				"\n\x1b[31mError: Database formatting failed\n\x1b[0m",
				error,
			);
			console.error("\n\x1b[33mPreserving administrator access\x1b[0m");
		}
		try {
			await ensureAdministratorExists().then(() => {
				console.log("\x1b[32mSuccess:\x1b[0m Administrator access restored\n");
			});
		} catch (error) {
			console.error("\nError: Administrator creation failed", error);
			console.error(
				"\n\x1b[31mAdministrator access may be lost, try reformatting DB to restore access\x1b[0m\n",
			);
		}
		process.exit(0);
	} else {
		console.log("Operation cancelled");
		await disconnect();
	}
}

await main();
