import fs, { constants } from "node:fs";
import path from "node:path";

export const envFileBackup = async (
	shouldBackup: boolean,
): Promise<boolean> => {
	try {
		if (!shouldBackup) return false;

		const cwd = process.cwd();
		const envPath = path.join(cwd, ".env");

		try {
			await fs.promises.access(envPath, constants.F_OK);

			const archiveDir = path.join(cwd, ".backup");
			await fs.promises.mkdir(archiveDir, { recursive: true });

			const epochTimestamp = Math.floor(Date.now() / 1000);
			const timestampedFile = path.join(archiveDir, `.env.${epochTimestamp}`);
			await fs.promises.copyFile(envPath, timestampedFile);

			console.log(`\n Backup created at ${timestampedFile}`);
			return true;
		} catch (err) {
			const e = err as NodeJS.ErrnoException;
			if (e.code === "ENOENT") {
				console.log("\n  No .env file found to backup.");
				return false;
			} else {
				throw err;
			}
		}
	} catch (error) {
		console.error("Error backing up .env file:", error);
		throw new Error(`Failed to backup .env file: ${(error as Error).message}`);
	}
};
