import type { UpdateEnvOptions } from "./envFileManager";
import { updateEnvVariable as updateEnvVariableInternal } from "./envFileManager";

/**
 * Updates environment variables in the .env or .env_test file and synchronizes them with `process.env`.
 *
 * Note: defaults to `.env_test` when `NODE_ENV === "test"` for backward compatibility.
 */
export async function updateEnvVariable(
	config: Record<string, string | number | undefined>,
	options: UpdateEnvOptions = {},
): Promise<void> {
	const envFile =
		options.envFile ?? (process.env.NODE_ENV === "test" ? ".env_test" : ".env");

	await updateEnvVariableInternal(config, { ...options, envFile });
}
