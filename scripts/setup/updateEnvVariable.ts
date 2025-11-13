import fs from "node:fs";
import path from "node:path";

/**
 * Updates environment variables in the .env or .env_test file and synchronizes them with `process.env`.
 * @param config - An object containing key-value pairs where the keys are the environment variable names and
 * the values are the new values for those variables.
 */
export function updateEnvVariable(config: {
	[key: string]: string | number;
}): void {
	const envFileName = process.env.NODE_ENV === "test" ? ".env_test" : ".env";

	// Resolve to absolute paths to avoid surprises in CI or tests that change CWD
	const envFilePath = path.resolve(process.cwd(), envFileName);
	const backupFilePath = `${envFilePath}.backup`;

	// Attempt to create a backup. In test environments, tolerate backup failures.
	if (fs.existsSync(envFilePath)) {
		try {
			fs.copyFileSync(envFilePath, backupFilePath);
		} catch (err) {
			if (process.env.NODE_ENV !== "test") {
				throw err;
			}
			// swallow backup copy errors in tests
		}
	}

	try {
		let existingContent = "";
		try {
			if (fs.existsSync(envFilePath)) {
				existingContent = fs.readFileSync(envFilePath, "utf8");
			}
		} catch (readErr: any) {
			// Treat missing file as empty. Re-throw other read errors.
			if (readErr && readErr.code && readErr.code !== "ENOENT") {
				throw readErr;
			}
			existingContent = "";
		}

		let updatedContent = existingContent;

		for (const key in config) {
			const value = config[key];
			const regex = new RegExp(`^${key.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}=.*`, "gm");

			if (regex.test(updatedContent)) {
				updatedContent = updatedContent.replace(regex, `${key}=${value}`);
			} else {
				updatedContent = updatedContent ? `${updatedContent}\n${key}=${value}` : `${key}=${value}`;
			}

			process.env[key] = String(value);
		}

		// Ensure write creates file regardless of previous state
		fs.writeFileSync(envFilePath, updatedContent, { encoding: "utf8", flag: "w" });
	} catch (error) {
		// Attempt to restore backup if present
		try {
			if (fs.existsSync(backupFilePath)) {
				fs.copyFileSync(backupFilePath, envFilePath);
			}
		} catch {
			// ignore restore failure in tests
		}
		throw error;
	}
}
