import { promises as fs } from "node:fs";

/**
 * Updates environment variables in the .env or .env_test file and synchronizes them with `process.env`.
 * @param config - An object containing key-value pairs where the keys are the environment variable names and
 * the values are the new values for those variables.
 */
export async function updateEnvVariable(config: {
	[key: string]: string | number | undefined;
}): Promise<void> {
	const envFileName = process.env.NODE_ENV === "test" ? ".env_test" : ".env";

	const backupFile = `${envFileName}.backup`;
	let backupCreated = false;

	try {
		await fs.access(envFileName);
		await fs.copyFile(envFileName, backupFile);
		backupCreated = true;
	} catch (err: unknown) {
		const error = err as NodeJS.ErrnoException;
		if (error.code !== "ENOENT") {
			console.error("Error creating backup:", error);
			throw error;
		}
	}

	try {
		let existingContent = "";
		try {
			existingContent = await fs.readFile(envFileName, "utf8");
		} catch (err: unknown) {
			const error = err as NodeJS.ErrnoException;
			if (error.code !== "ENOENT") {
				console.error("Error reading env file:", error);
				throw error;
			}
		}

		let updatedContent: string = existingContent;

		for (const key in config) {
			const value = config[key];
			// Skip undefined values
			if (value === undefined) {
				continue;
			}

			const regex = new RegExp(
				`^${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=.*`,
				"gm",
			);

			if (regex.test(updatedContent)) {
				updatedContent = updatedContent.replace(regex, `${key}=${value}`);
			} else {
				updatedContent += `\n${key}=${value}`;
			}

			process.env[key] = String(value);
		}

		await fs.writeFile(envFileName, updatedContent, "utf8");
	} catch (error) {
		if (backupCreated) {
			try {
				await fs.copyFile(backupFile, envFileName);
			} catch (restoreErr: unknown) {
				const restoreError = restoreErr as NodeJS.ErrnoException;
				if (restoreError.code !== "ENOENT") {
					console.error("Error restoring backup:", restoreError);
					throw restoreError;
				}
			}
		}
		throw error;
	}
}
