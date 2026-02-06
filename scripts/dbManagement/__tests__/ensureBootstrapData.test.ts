import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("ensureBootstrapData", () => {
	let ensureBootstrapData: () => Promise<void>;

	let usersFindFirst: ReturnType<typeof vi.fn>;
	let communitiesFindFirst: ReturnType<typeof vi.fn>;
	let insertValues: ReturnType<typeof vi.fn>;
	let updateWhere: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		// Strong isolation for sharded / threaded CI
		vi.resetModules();
		vi.clearAllMocks();

		// Fresh mocks per test
		usersFindFirst = vi.fn();
		communitiesFindFirst = vi.fn();
		insertValues = vi.fn();
		updateWhere = vi.fn();

		vi.doMock("../helpers", async () => {
			const original =
				await vi.importActual<typeof import("../helpers")>("../helpers");

			return {
				...original,
				db: {
					query: {
						usersTable: { findFirst: usersFindFirst },
						communitiesTable: { findFirst: communitiesFindFirst },
					},
					insert: vi.fn(() => ({
						values: insertValues,
					})),
					update: vi.fn(() => ({
						set: vi.fn(() => ({
							where: updateWhere,
						})),
					})),
				},
				envConfig: {
					...original.envConfig,
					API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "admin@test.com",
					API_ADMINISTRATOR_USER_NAME: "Admin",
					API_ADMINISTRATOR_USER_PASSWORD: "password",
					API_COMMUNITY_NAME: "Test Community",
				},
			};
		});

		vi.doMock("uuidv7", () => ({
			uuidv7: vi.fn(() => "uuid-123"),
		}));

		vi.doMock("@node-rs/argon2", () => ({
			hash: vi.fn(async () => "hashed-password"),
		}));

		const helpers = await import("../helpers");
		ensureBootstrapData = helpers.ensureBootstrapData;
	});

	afterEach(() => {
		vi.resetModules();
	});

	/* ------------------------------------------------------------------ */
	/* Env validation                                                      */
	/* ------------------------------------------------------------------ */

	it.each([
		"API_ADMINISTRATOR_USER_EMAIL_ADDRESS",
		"API_ADMINISTRATOR_USER_NAME",
		"API_ADMINISTRATOR_USER_PASSWORD",
	] as const)("throws if %s is missing", async (missingKey) => {
		const { envConfig } = await import("../helpers");

		// Explicitly narrow to string env vars only
		type AdminEnvKey =
			| "API_ADMINISTRATOR_USER_EMAIL_ADDRESS"
			| "API_ADMINISTRATOR_USER_NAME"
			| "API_ADMINISTRATOR_USER_PASSWORD";

		const key = missingKey as AdminEnvKey;
		const originalValue = envConfig[key];

		try {
			envConfig[key] = "";
			await expect(ensureBootstrapData()).rejects.toThrow(
				"Missing administrator environment variables",
			);
		} finally {
			envConfig[key] = originalValue;
		}
	});

	/* ------------------------------------------------------------------ */
	/* Admin bootstrap                                                     */
	/* ------------------------------------------------------------------ */

	it("updates role if admin exists with non-administrator role", async () => {
		usersFindFirst.mockResolvedValue({ role: "member" });
		communitiesFindFirst.mockResolvedValue({ id: "community-id" });

		await ensureBootstrapData();

		expect(updateWhere).toHaveBeenCalled();
	});

	it("creates admin user if missing", async () => {
		usersFindFirst.mockResolvedValue(null);
		communitiesFindFirst.mockResolvedValue({ id: "community-id" });

		await ensureBootstrapData();

		expect(insertValues).toHaveBeenCalled();
	});

	/* ------------------------------------------------------------------ */
	/* Community bootstrap                                                 */
	/* ------------------------------------------------------------------ */

	it("creates community if missing", async () => {
		usersFindFirst.mockResolvedValue({ role: "administrator" });
		communitiesFindFirst.mockResolvedValue(null);

		await ensureBootstrapData();

		expect(insertValues).toHaveBeenCalled();
	});

	it("creates admin and community when both are missing", async () => {
		usersFindFirst.mockResolvedValue(null);
		communitiesFindFirst.mockResolvedValue(null);

		await ensureBootstrapData();

		// One insert for admin, one for community
		expect(insertValues).toHaveBeenCalledTimes(2);
	});

	/* ------------------------------------------------------------------ */
	/* Idempotency                                                         */
	/* ------------------------------------------------------------------ */

	it("is idempotent when admin and community already exist", async () => {
		usersFindFirst.mockResolvedValue({ role: "administrator" });
		communitiesFindFirst.mockResolvedValue({ id: "community-id" });

		await ensureBootstrapData();

		expect(insertValues).not.toHaveBeenCalled();
		expect(updateWhere).not.toHaveBeenCalled();
	});
});
