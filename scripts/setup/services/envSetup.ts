import {
	checkEnvFile as checkEnvFileInternal,
	initializeEnvFile as initializeEnvFileInternal,
} from "../envFileManager";
import {
	envBackupFile,
	envFileName,
	envTempFile,
	isBackupCreated,
	type SetupAnswers,
} from "./sharedSetup";

export async function checkEnvFile(): Promise<boolean> {
	return checkEnvFileInternal(envFileName);
}

export async function initializeEnvFile(answers: SetupAnswers): Promise<void> {
	const envFileToUse =
		answers.CI === "true" ? "envFiles/.env.ci" : "envFiles/.env.devcontainer";
	try {
		await initializeEnvFileInternal({
			ci: answers.CI === "true",
			envFile: envFileName,
			backupFile: envBackupFile,
			tempFile: envTempFile,
			templateCiFile: "envFiles/.env.ci",
			templateDevcontainerFile: "envFiles/.env.devcontainer",
			restoreFromBackup: isBackupCreated(),
		});
		console.log(
			`✅ Environment variables loaded successfully from ${envFileToUse}`,
		);
	} catch (error) {
		console.error(
			`❌ Error: Failed to load environment file '${envFileToUse}'.`,
		);
		console.error(error instanceof Error ? error.message : error);
		throw error;
	}
}
