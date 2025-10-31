import { constants } from "node:fs";
import { access, copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import inquirer from "inquirer";

export const envFileBackup = async (): Promise<void> => {
	const { shouldBackup } = await inquirer.prompt([
		{
			type: "confirm",
			name: "shouldBackup",
			message:
				"Would you like to back up the current .env file?",
			default: true,
		},
	]);

	if (!shouldBackup) return;

	const cwd = process.cwd();
	const backupDir = path.join(cwd, ".backup");
	const envPath = path.join(cwd, ".env");

	// Step 1: Create .backup directory
	try {
		await mkdir(backupDir, { recursive: true });
		console.log(`Backup directory ensured at: ${backupDir}`);
	} catch (error) {
		throw new Error(
			`Failed to create .env backup: ${(error as Error).message}`,
		);
	}

	// Step 2: Check and copy .env file
	try {
		await access(envPath, constants.F_OK);
		const epochTimestamp = Math.floor(Date.now() / 1000);
		const backupFileName = `.env.${epochTimestamp}`;
		const backupFilePath = path.join(backupDir, backupFileName);

		await copyFile(envPath, backupFilePath);
		console.log(`Backup created: ${backupFileName}`);
		console.log(`Backup location: ${backupFilePath}`);
	} catch (error) {
		const err = error as NodeJS.ErrnoException;
		if (err.code === "ENOENT") {
			console.warn("No .env file found; skipping backup.");
			return;
		}
		throw new Error(`Failed to backup .env file: ${err.message}`);
	}
};
