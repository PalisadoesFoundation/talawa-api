import { beforeEach, describe, expect, it, vi } from "vitest";

/* -------------------------------------------------------------------------- */
/*                                  Mocks                                     */
/* -------------------------------------------------------------------------- */

const usersFindFirst = vi.fn();
const communitiesFindFirst = vi.fn();
const insert = vi.fn();
const update = vi.fn();

vi.mock("@node-rs/argon2", () => ({
	hash: vi.fn().mockResolvedValue("hashed-password"),
}));

vi.mock("uuidv7", () => ({
	uuidv7: vi.fn().mockReturnValue("uuid-123"),
}));

vi.mock("../helpers", async () => {
	const actual =
		await vi.importActual<typeof import("../helpers")>("../helpers");

	return {
		...actual, // keep ensureBootstrapData export
		db: {
			query: {
				usersTable: {
					findFirst: usersFindFirst,
				},
				communitiesTable: {
					findFirst: communitiesFindFirst,
				},
			},
			insert,
			update,
		},
		envConfig: {
			API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "admin@test.com",
			API_ADMINISTRATOR_USER_NAME: "Admin",
			API_ADMINISTRATOR_USER_PASSWORD: "password",
			API_COMMUNITY_NAME: "Test Community",
			API_COMMUNITY_FACEBOOK_URL: null,
			API_COMMUNITY_GITHUB_URL: null,
			API_COMMUNITY_INSTAGRAM_URL: null,
			API_COMMUNITY_LINKEDIN_URL: null,
			API_COMMUNITY_REDDIT_URL: null,
			API_COMMUNITY_SLACK_URL: null,
			API_COMMUNITY_WEBSITE_URL: null,
			API_COMMUNITY_X_URL: null,
			API_COMMUNITY_YOUTUBE_URL: null,
			API_COMMUNITY_INACTIVITY_TIMEOUT_DURATION: 30,
		},
	};
});

/* -------------------------------------------------------------------------- */
/*                                   Tests                                    */
/* -------------------------------------------------------------------------- */

describe.concurrent("ensureBootstrapData", () => {
	let ensureBootstrapData: () => Promise<void>;

	beforeEach(async () => {
		vi.clearAllMocks();
		const helpers = await import("../helpers");
		ensureBootstrapData = helpers.ensureBootstrapData;
	});

	it.concurrent("throws if administrator env vars are missing", async () => {
		const helpers = await import("../helpers");

		helpers.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS = "";

		await expect(ensureBootstrapData()).rejects.toThrow(
			"Missing administrator environment variables",
		);
	});

	it.concurrent("updates role if admin exists with non-administrator role", async () => {
		usersFindFirst.mockResolvedValue({ role: "member" });
		communitiesFindFirst.mockResolvedValue({ id: "community-id" });

		await ensureBootstrapData();

		expect(update).toHaveBeenCalled();
	});

	it.concurrent("creates admin user if missing", async () => {
		usersFindFirst.mockResolvedValue(null);
		communitiesFindFirst.mockResolvedValue({ id: "community-id" });

		await ensureBootstrapData();

		expect(insert).toHaveBeenCalled();
	});

	it.concurrent("creates community if missing", async () => {
		usersFindFirst.mockResolvedValue({ role: "administrator" });
		communitiesFindFirst.mockResolvedValue(null);

		await ensureBootstrapData();

		expect(insert).toHaveBeenCalled();
	});

	it.concurrent("is idempotent when admin and community already exist", async () => {
		usersFindFirst.mockResolvedValue({ role: "administrator" });
		communitiesFindFirst.mockResolvedValue({ id: "community-id" });

		await ensureBootstrapData();

		expect(insert).not.toHaveBeenCalled();
		expect(update).not.toHaveBeenCalled();
	});
});
