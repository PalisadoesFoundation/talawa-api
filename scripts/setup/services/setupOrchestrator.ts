import process from "node:process";
import { ensureBackup } from "../AtomicEnvWriter";
import { emailSetup } from "../emailSetup";
import { promptConfirm } from "../promptHelpers";
import { updateEnvVariable } from "../updateEnvVariable";
import { generateJwtSecret } from "../validators";
import { administratorEmail } from "./administratorSetup";
import { apiSetup } from "./apiSetup";
import { cachingSetup } from "./cachingSetup";
import { caddySetup } from "./caddySetup";
import { cloudbeaverSetup } from "./cloudbeaverSetup";
import { minioSetup } from "./minioSetup";
import { postgresSetup } from "./postgresSetup";
import {
	envBackupFile,
	envFileName,
	envTempFile,
	isBackupCreated,
	markBackupCreated,
	type SetupAnswers,
} from "./sharedSetup";

export type CoreSetupDeps = {
	setCI: (answers: SetupAnswers) => Promise<SetupAnswers>;
	initializeEnvFile: (answers: SetupAnswers) => Promise<void>;
};

export type OptionalSetupDeps = {
	reCaptchaSetup: (answers: SetupAnswers) => Promise<SetupAnswers>;
	oauthSetup: (answers: SetupAnswers) => Promise<SetupAnswers>;
	observabilitySetup: (answers: SetupAnswers) => Promise<SetupAnswers>;
	metricsSetup: (answers: SetupAnswers) => Promise<SetupAnswers>;
	restAuthSetup: (answers: SetupAnswers) => Promise<SetupAnswers>;
};

export function registerCleanupHandlers(
	gracefulCleanup: (signal: string) => Promise<void>,
): () => void {
	const sigintHandler = () => {
		void gracefulCleanup("SIGINT");
	};
	const sigtermHandler = () => {
		void gracefulCleanup("SIGTERM");
	};

	process.on("SIGINT", sigintHandler);
	process.on("SIGTERM", sigtermHandler);

	return () => {
		process.removeListener("SIGINT", sigintHandler);
		process.removeListener("SIGTERM", sigtermHandler);
	};
}

export async function maybeReconfigureExistingEnv(
	hasExistingEnv: boolean,
): Promise<void> {
	if (!hasExistingEnv) {
		return;
	}

	const envReconfigure = await promptConfirm(
		"envReconfigure",
		"Env file found. Re-configure?",
		true,
	);
	if (!envReconfigure) {
		process.exit(0);
	}
}

export async function maybeCreateEnvBackup(
	hasExistingEnv: boolean,
	initialCI: string | undefined,
): Promise<void> {
	if (!hasExistingEnv) {
		console.log("ℹ️  No existing .env found; backup skipped.");
		return;
	}

	const isInteractive = initialCI !== "true" && process.stdin?.isTTY;
	let shouldBackup = true;

	if (isInteractive) {
		try {
			shouldBackup = await promptConfirm(
				"shouldBackup",
				"Would you like to back up the current .env file before setup modifies it?",
				true,
			);
		} catch (err) {
			if (process.env.NODE_ENV === "production" || initialCI === "true") {
				console.error("Prompt failed (fatal):", err);
				process.exit(1);
			}
			throw err;
		}
	} else {
		shouldBackup = process.env.TALAWA_SKIP_ENV_BACKUP !== "true";
	}

	if (!shouldBackup) {
		console.log("ℹ️  Skipping .env backup (by user/config choice).");
		return;
	}

	try {
		await ensureBackup(envFileName, envBackupFile);
		markBackupCreated();
		console.log(`✅ Backup created: ${envBackupFile}`);
	} catch (err) {
		if (process.env.NODE_ENV === "production" || initialCI === "true") {
			console.error("Backup creation failed (fatal):", err);
			process.exit(1);
		}
		throw err;
	}
}

export async function runCoreSetupPrompts(
	answers: SetupAnswers,
	deps: CoreSetupDeps,
): Promise<SetupAnswers> {
	answers = await deps.setCI(answers);
	await deps.initializeEnvFile(answers);

	const useDefaultApi = await promptConfirm(
		"useDefaultApi",
		"Use recommended default API settings?",
		true,
	);
	if (!useDefaultApi) {
		answers = await apiSetup(answers);
	}

	const useDefaultMinio = await promptConfirm(
		"useDefaultMinio",
		"Use recommended default Minio settings?",
		true,
	);
	if (!useDefaultMinio) {
		answers = await minioSetup(answers);
	}

	if (answers.CI === "false") {
		const useDefaultCloudbeaver = await promptConfirm(
			"useDefaultCloudbeaver",
			"Use recommended default CloudBeaver settings?",
			true,
		);
		if (!useDefaultCloudbeaver) {
			answers = await cloudbeaverSetup(answers);
		}
	}

	const useDefaultPostgres = await promptConfirm(
		"useDefaultPostgres",
		"Use recommended default Postgres settings?",
		true,
	);
	if (!useDefaultPostgres) {
		answers = await postgresSetup(answers);
	}

	const useDefaultCaddy = await promptConfirm(
		"useDefaultCaddy",
		"Use recommended default Caddy settings?",
		true,
	);
	if (!useDefaultCaddy) {
		answers = await caddySetup(answers);
	}

	answers = await administratorEmail(answers);

	return answers;
}

export async function runOptionalFeaturePrompts(
	answers: SetupAnswers,
	deps: OptionalSetupDeps,
): Promise<SetupAnswers> {
	const setupReCaptcha = await promptConfirm(
		"setupReCaptcha",
		"Do you want to set up Google reCAPTCHA v3 now?",
		false,
	);
	if (setupReCaptcha) {
		answers = await deps.reCaptchaSetup(answers);
	}

	answers = await emailSetup(answers);

	const setupOAuth = await promptConfirm(
		"setupOAuth",
		"Do you want to set up OAuth providers now?",
		false,
	);
	if (setupOAuth) {
		answers = await deps.oauthSetup(answers);
	}

	const setupObservability = await promptConfirm(
		"setupObservability",
		"Do you want to configure OpenTelemetry observability now?",
		false,
	);
	if (setupObservability) {
		answers = await deps.observabilitySetup(answers);
	}

	const setupMetrics = await promptConfirm(
		"setupMetrics",
		"Do you want to configure performance metrics settings now?",
		false,
	);
	if (setupMetrics) {
		answers = await deps.metricsSetup(answers);
	}

	const setupCaching = await promptConfirm(
		"setupCaching",
		"Do you want to configure caching settings now?",
		false,
	);
	if (setupCaching) {
		answers = await cachingSetup(answers);
	}

	const setupRestAuth = await promptConfirm(
		"setupRestAuth",
		"Do you want to configure REST auth (signin, refresh, cookies) now?",
		false,
	);
	if (setupRestAuth) {
		answers = await deps.restAuthSetup(answers);
	} else if (answers.API_COOKIE_SECRET === undefined) {
		// Env schema requires API_COOKIE_SECRET; ensure it is set when REST auth setup is skipped.
		answers.API_COOKIE_SECRET = generateJwtSecret();
	}

	return answers;
}

export async function persistSetupAnswers(
	answers: SetupAnswers,
): Promise<void> {
	await updateEnvVariable(answers, {
		envFile: envFileName,
		backupFile: envBackupFile,
		tempFile: envTempFile,
		createBackup: false,
		restoreFromBackup: isBackupCreated(),
	});
}
