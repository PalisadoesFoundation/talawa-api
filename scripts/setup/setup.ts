import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import * as dotenv from "dotenv";
import {
	restoreBackup as atomicRestoreBackup,
	cleanupTemp,
} from "./AtomicEnvWriter";
import { setCI } from "./services/ciSetup";
import { checkEnvFile, initializeEnvFile } from "./services/envSetup";
import { metricsSetup } from "./services/metricsSetup";
import { oauthSetup } from "./services/oauthSetup";
import { observabilitySetup } from "./services/observabilitySetup";
import { reCaptchaSetup } from "./services/reCaptchaSetup";
import { restAuthSetup } from "./services/restAuthSetup";
import {
	maybeCreateEnvBackup,
	maybeReconfigureExistingEnv,
	persistSetupAnswers,
	registerCleanupHandlers,
	runCoreSetupPrompts,
	runOptionalFeaturePrompts,
} from "./services/setupOrchestrator";
import {
	envBackupFile,
	envFileName,
	envTempFile,
	isBackupCreated,
	type SetupAnswers,
	setBackupCreated,
} from "./services/sharedSetup";

export { administratorEmail } from "./services/administratorSetup";
export { apiSetup } from "./services/apiSetup";
export { cachingSetup } from "./services/cachingSetup";
export { caddySetup } from "./services/caddySetup";
export { setCI } from "./services/ciSetup";
export { cloudbeaverSetup } from "./services/cloudbeaverSetup";
export { checkEnvFile, initializeEnvFile } from "./services/envSetup";
export { metricsSetup } from "./services/metricsSetup";
export { minioSetup } from "./services/minioSetup";
export { oauthSetup } from "./services/oauthSetup";
export { observabilitySetup } from "./services/observabilitySetup";
export { postgresSetup } from "./services/postgresSetup";
export { reCaptchaSetup } from "./services/reCaptchaSetup";
export { restAuthSetup } from "./services/restAuthSetup";
export {
	envBackupFile,
	envFileName,
	envTempFile,
	handlePromptError,
	isBackupCreated,
	markBackupCreated,
	type SetupAnswers,
	type SetupKey,
	setBackupCreated,
} from "./services/sharedSetup";
export {
	isBooleanString,
	validateAllAnswers,
	validateBooleanFields,
	validatePortNumbers,
	validateRequiredFields,
	validateSamplingRatio,
} from "./services/validationSetup";
export {
	generateJwtSecret,
	validateCloudBeaverAdmin,
	validateCloudBeaverPassword,
	validateCloudBeaverURL,
	validateEmail,
	validatePort,
	validatePositiveInteger,
	validateURL,
} from "./validators";

let cleaningUp = false;
let exitCalled = false;

export async function gracefulCleanup(
	signal?: string,
	exitFn: (code: number) => never = (code) => process.exit(code),
): Promise<void> {
	if (cleaningUp) {
		console.log("\nAlready cleaning up, please wait...");
		return;
	}
	cleaningUp = true;
	console.log(
		signal === undefined
			? "\n\n⚠️  Setup interrupted by user (CTRL+C)"
			: `\n\n⚠️  Setup interrupted by signal ${signal}. Cleaning up...`,
	);
	let exitCode = signal === undefined ? 0 : 1;
	try {
		try {
			await cleanupTemp(envTempFile);
		} catch (tempErr) {
			console.warn("⚠️  Failed to clean temp file:", tempErr);
		}
		if (isBackupCreated()) {
			await atomicRestoreBackup(envFileName, envBackupFile);
			console.log("✅ Original configuration restored successfully");
		} else {
			console.log("✓ Cleanup complete. No backup to restore.");
		}
	} catch (e) {
		console.error("✗ Cleanup encountered errors:", e);
		exitCode = 1;
	}
	if (!exitCalled) {
		exitCalled = true;
		exitFn(exitCode);
	}
}

export function resetCleanupState(options?: {
	backupCreated?: boolean;
	cleaning?: boolean;
}): void {
	setBackupCreated(options?.backupCreated ?? false);
	cleaningUp = options?.cleaning ?? false;
	exitCalled = false;
}

function resetSetupState(): void {
	setBackupCreated(false);
	cleaningUp = false;
	exitCalled = false;
}

export async function setup(): Promise<SetupAnswers> {
	resetSetupState();
	const unregisterCleanupHandlers = registerCleanupHandlers((signal) =>
		gracefulCleanup(signal),
	);
	const initialCI = process.env.CI;
	let answers: SetupAnswers = {};
	const hasExistingEnv = await checkEnvFile();
	await maybeReconfigureExistingEnv(hasExistingEnv);
	dotenv.config({ path: envFileName });
	await maybeCreateEnvBackup(hasExistingEnv, initialCI);
	answers = await runCoreSetupPrompts(answers, { setCI, initializeEnvFile });
	answers = await runOptionalFeaturePrompts(answers, {
		reCaptchaSetup,
		oauthSetup,
		observabilitySetup,
		metricsSetup,
		restAuthSetup,
	});
	await persistSetupAnswers(answers);
	console.log("Configuration complete.");
	unregisterCleanupHandlers();
	return answers;
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
	setup().catch((err) => {
		if (err instanceof Error && err.name === "ExitPromptError") {
			console.error("Setup interrupted by user.");
		} else {
			console.error("Setup failed:", err);
		}
		process.exit(1);
	});
}
