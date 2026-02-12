/**
 * Runs in each Vitest worker before test files are loaded.
 * Ensures tokens.ts (and other modules that check NODE_ENV/AUTH_JWT_SECRET) can load
 * when unit tests import the auth plugin or auth services.
 */
process.env.NODE_ENV = "test";
if (!process.env.AUTH_JWT_SECRET) {
	process.env.AUTH_JWT_SECRET = "unit-test-secret";
}
