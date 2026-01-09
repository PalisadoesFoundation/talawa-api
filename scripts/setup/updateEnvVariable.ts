import { promises as fs } from "node:fs";

/**
 * Updates environment variables in the .env or .env_test file and synchronizes them with `process.env`.
 * @param config - An object containing key-value pairs where the keys are the environment variable names and
 * the values are the new values for those variables.
 */
export async function updateEnvVariable(config: {
	[key: string]: string | number;
}): Promise<void> {
	const envFileName = process.env.NODE_ENV === "test" ? ".env_test" : ".env";

	const backupFile = `${envFileName}.backup`;
	try {
		await fs.access(envFileName);
		await fs.copyFile(envFileName, backupFile);
	} catch {}

	try {
		let existingContent = "";
		try {
			existingContent = await fs.readFile(envFileName, "utf8");
		} catch {}

		let updatedContent: string = existingContent;

		for (const key in config) {
			const value = config[key];
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
		try {
			await fs.copyFile(backupFile, envFileName);
		} catch {}
		throw error;
	}
}