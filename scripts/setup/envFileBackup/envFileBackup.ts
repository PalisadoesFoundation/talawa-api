import fs, { constants } from "node:fs";
import path from "node:path";

export const backupEnvFile = (shouldBackup: boolean): void => {
	try {
		if (!shouldBackup) return;

		const cwd = process.cwd();
		const envPath = path.join(cwd, ".env");

		try {
			fs.accessSync(envPath, constants.F_OK);

			const archiveDir = path.join(cwd, ".backup");
			fs.mkdirSync(archiveDir, { recursive: true });

			const epochTimestamp = Math.floor(Date.now() / 1000);
			const timestampedFile = path.join(archiveDir, `.env.${epochTimestamp}`);
			fs.copyFileSync(envPath, timestampedFile);

			const backupFilePath = path.join(cwd, ".env.backup");
			fs.copyFileSync(envPath, backupFilePath);

			console.log(`\n Backup created at ${backupFilePath}`);
			console.log(`   Archive: ${timestampedFile}`);
		} catch (err) {
			const e = err as NodeJS.ErrnoException;
			if (e.code === "ENOENT") {
				console.log("\n  No .env file found to backup.");
			} else {
				throw err;
			}
		}
	} catch (error) {
		console.error("Error backing up .env file:", error);
		throw new Error(`Failed to backup .env file: ${(error as Error).message}`);
	}
};
export default backupEnvFile;
