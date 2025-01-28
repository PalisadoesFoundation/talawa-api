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

	// Read the existing content of the .env or .env_test file
	const existingContent: string = fs.existsSync(envFileName)
		? fs.readFileSync(envFileName, "utf8")
		: "";

	let updatedContent: string = existingContent;

	// Update the .env file and process.env for each variable
	for (const key in config) {
		const value = config[key];
		const regex = new RegExp(
			`^${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=.*`,
			"gm",
		);

		// Update or add the variable in the .env file
		if (regex.test(updatedContent)) {
			updatedContent = updatedContent.replace(regex, `${key}=${value}`);
		} else {
			updatedContent += `\n${key}=${value}`;
		}

		// Update the variable in process.env
		process.env[key] = String(value);
	}

	// Write the updated content back to the .env or .env_test file
	fs.writeFileSync(envFileName, updatedContent, "utf8");
}
