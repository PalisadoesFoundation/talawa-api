import fs from "node:fs";

/**
 * Updates environment variables in the .env or .env_test file and synchronizes them with `process.env`.
 * @param config - An object containing key-value pairs where the keys are the environment variable names and
 * the values are the new values for those variables.
 */
export function updateEnvVariable(config: {
	[key: string]: string | number;
}): void {
	const envFileName = process.env.NODE_ENV === "test" ? ".env_test" : ".env";

	const backupFile = `${envFileName}.backup`;
	// Only create backup if it doesn't already exist
	// (setup() may have already created it with the original .env content)
	if (fs.existsSync(envFileName) && !fs.existsSync(backupFile)) {
		fs.copyFileSync(envFileName, backupFile);
	}

	try {
		const existingContent: string = fs.existsSync(envFileName)
			? fs.readFileSync(envFileName, "utf8")
			: "";

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

		fs.writeFileSync(envFileName, updatedContent, "utf8");
	} catch (error) {
		if (fs.existsSync(backupFile)) {
			fs.copyFileSync(backupFile, envFileName);
		}
		throw error;
	}
}
