import * as process from "node:process";
import { restoreBackup as atomicRestoreBackup } from "../AtomicEnvWriter";

/**
 * Define a union type of all allowed environment keys
 */
export type SetupKey =
	| "CI"
	| "API_ADMINISTRATOR_USER_EMAIL_ADDRESS"
	| "RECAPTCHA_SECRET_KEY"
	| "RECAPTCHA_SCORE_THRESHOLD"
	| "API_BASE_URL"
	| "API_HOST"
	| "API_PORT"
	| "API_IS_APPLY_DRIZZLE_MIGRATIONS"
	| "API_IS_GRAPHIQL"
	| "API_IS_PINO_PRETTY"
	| "API_JWT_EXPIRES_IN"
	| "API_JWT_SECRET"
	| "API_EMAIL_VERIFICATION_TOKEN_EXPIRES_SECONDS"
	| "API_EMAIL_VERIFICATION_TOKEN_HMAC_SECRET"
	| "API_LOG_LEVEL"
	| "API_MINIO_ACCESS_KEY"
	| "API_MINIO_END_POINT"
	| "API_MINIO_PORT"
	| "API_MINIO_SECRET_KEY"
	| "API_MINIO_TEST_END_POINT"
	| "API_MINIO_USE_SSL"
	| "API_POSTGRES_DATABASE"
	| "API_POSTGRES_HOST"
	| "API_POSTGRES_PASSWORD"
	| "API_POSTGRES_PORT"
	| "API_POSTGRES_SSL_MODE"
	| "API_POSTGRES_TEST_HOST"
	| "API_POSTGRES_USER"
	| "CLOUDBEAVER_ADMIN_NAME"
	| "CLOUDBEAVER_ADMIN_PASSWORD"
	| "CLOUDBEAVER_MAPPED_HOST_IP"
	| "CLOUDBEAVER_MAPPED_PORT"
	| "CLOUDBEAVER_SERVER_NAME"
	| "CLOUDBEAVER_SERVER_URL"
	| "MINIO_BROWSER"
	| "MINIO_API_MAPPED_HOST_IP"
	| "MINIO_API_MAPPED_PORT"
	| "MINIO_CONSOLE_MAPPED_HOST_IP"
	| "MINIO_CONSOLE_MAPPED_PORT"
	| "MINIO_ROOT_PASSWORD"
	| "MINIO_ROOT_USER"
	| "POSTGRES_DB"
	| "POSTGRES_MAPPED_HOST_IP"
	| "POSTGRES_MAPPED_PORT"
	| "POSTGRES_PASSWORD"
	| "POSTGRES_USER"
	| "CADDY_HTTP_MAPPED_PORT"
	| "CADDY_HTTPS_MAPPED_PORT"
	| "CADDY_HTTP3_MAPPED_PORT"
	| "CADDY_TALAWA_API_DOMAIN_NAME"
	| "CADDY_TALAWA_API_EMAIL"
	| "CADDY_TALAWA_API_HOST"
	| "CADDY_TALAWA_API_PORT"
	| "API_OTEL_ENABLED"
	| "API_OTEL_SERVICE_NAME"
	| "API_OTEL_SAMPLING_RATIO"
	| "API_OTEL_EXPORTER_ENABLED"
	| "API_OTEL_EXPORTER_TYPE"
	| "API_OTEL_TRACE_EXPORTER_ENDPOINT"
	| "API_OTEL_METRIC_EXPORTER_ENDPOINT"
	| "API_EMAIL_PROVIDER"
	| "API_AWS_SES_REGION"
	| "API_AWS_ACCESS_KEY_ID"
	| "API_AWS_SECRET_ACCESS_KEY"
	| "API_AWS_SES_FROM_EMAIL"
	| "API_AWS_SES_FROM_NAME"
	| "MAILPIT_MAPPED_HOST_IP"
	| "MAILPIT_WEB_MAPPED_PORT"
	| "MAILPIT_SMTP_MAPPED_PORT"
	| "GOOGLE_CLIENT_ID"
	| "GOOGLE_CLIENT_SECRET"
	| "GOOGLE_REDIRECT_URI"
	| "GITHUB_CLIENT_ID"
	| "GITHUB_CLIENT_SECRET"
	| "GITHUB_REDIRECT_URI"
	| "API_OAUTH_REQUEST_TIMEOUT_MS"
	| "API_METRICS_ENABLED"
	| "API_METRICS_API_KEY"
	| "API_METRICS_SLOW_REQUEST_MS"
	| "API_METRICS_SLOW_OPERATION_MS"
	| "API_METRICS_CACHE_TTL_SECONDS"
	| "API_METRICS_AGGREGATION_ENABLED"
	| "API_METRICS_AGGREGATION_CRON_SCHEDULE"
	| "API_METRICS_AGGREGATION_WINDOW_MINUTES"
	| "API_METRICS_SNAPSHOT_RETENTION_COUNT"
	| "API_SMTP_HOST"
	| "API_SMTP_PORT"
	| "API_SMTP_USER"
	| "API_SMTP_PASSWORD"
	| "API_SMTP_SECURE"
	| "API_SMTP_FROM_EMAIL"
	| "API_SMTP_FROM_NAME"
	| "API_SMTP_NAME"
	| "API_SMTP_LOCAL_ADDRESS"
	| "CACHE_WARMING_ORG_COUNT";

/**
 * Type for the answers object collected during setup.
 * Uses Partial<Record<SetupKey, string>> & Index Signature to ensure
 * only allowed keys are used while remaining flexible for tests/dynamic access.
 */
export type SetupAnswers = Partial<Record<SetupKey, string>> & {
	[key: string]: string | undefined;
};

export const envFileName = ".env";
export const envBackupFile = ".env.backup";
export const envTempFile = ".env.tmp";

/**
 * Internal state for tracking if a backup has been created.
 * Protected by accessor functions to avoid direct mutation from other modules.
 */
let backupCreated = false;

/**
 * Sets the backup status.
 * Useful for resetting state between tests or at the start of setup.
 */
export function setBackupCreated(status: boolean): void {
	backupCreated = status;
}

/**
 * Marks that a backup has been successfully created.
 */
export function markBackupCreated(): void {
	setBackupCreated(true);
}

/**
 * Returns whether a backup has been created.
 */
export function isBackupCreated(): boolean {
	return backupCreated;
}

/**
 * Shared error handler for prompt failures.
 *
 * @param err - The encountered error.
 * @param exitFn - Optional injectable exit strategy (defaults to process.exit).
 *                 Useful for unit tests to prevent thread termination.
 */
export async function handlePromptError(
	err: unknown,
	exitFn: (code: number) => never = (code) => process.exit(code),
): Promise<never> {
	console.error(err);
	if (isBackupCreated()) {
		try {
			await atomicRestoreBackup(envFileName, envBackupFile);
			console.log("✅ Original configuration restored successfully");
		} catch (restoreErr) {
			console.error("❌ Failed to restore backup:", restoreErr);
		}
	}
	return exitFn(1);
}
