import { beforeEach, describe, expect, it, vi } from "vitest";

/* ------------------------------------------------------------------ */
/* Chainable DB mocks                                                  */
/* ------------------------------------------------------------------ */

const insertValues = vi.fn();
const updateWhere = vi.fn();

const insert = vi.fn(() => ({
	values: insertValues,
}));

const update = vi.fn(() => ({
	set: vi.fn(() => ({
		where: updateWhere,
	})),
}));

const usersFindFirst = vi.fn();
const communitiesFindFirst = vi.fn();

/* ------------------------------------------------------------------ */
/* Module mock                                                         */
/* ------------------------------------------------------------------ */

vi.mock("../helpers", () => {
	return {
		db: {
			query: {
				usersTable: { findFirst: usersFindFirst },
				communitiesTable: { findFirst: communitiesFindFirst },
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

vi.mock("uuidv7", () => ({
	uuidv7: vi.fn(() => "uuid-123"),
}));

vi.mock("@node-rs/argon2", () => ({
	hash: vi.fn(async () => "hashed-password"),
}));

/* ------------------------------------------------------------------ */
/* Tests                                                              */
/* ------------------------------------------------------------------ */

describe.concurrent("ensureBootstrapData", () => {
	let ensureBootstrapData: () => Promise<void>;

	beforeEach(async () => {
		vi.clearAllMocks();
		const helpers = await import("../helpers");
		ensureBootstrapData = helpers.ensureBootstrapData;
	});

	it("throws if administrator env vars are missing", async () => {
		vi.resetModules();

		vi.doMock("../helpers", () => ({
			db: {
				query: {
					usersTable: { findFirst: vi.fn() },
					communitiesTable: { findFirst: vi.fn() },
				},
				insert,
				update,
			},
			envConfig: {
				API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "",
				API_ADMINISTRATOR_USER_NAME: "Admin",
				API_ADMINISTRATOR_USER_PASSWORD: "password",
			},
		}));

		const { ensureBootstrapData } = await import("../helpers");

		await expect(ensureBootstrapData()).rejects.toThrow(
			"Missing administrator environment variables",
		);
	});

	it("updates role if admin exists with non-administrator role", async () => {
		usersFindFirst.mockResolvedValue({ role: "member" });
		communitiesFindFirst.mockResolvedValue({ id: "community-id" });

		await ensureBootstrapData();

		expect(update).toHaveBeenCalled();
		expect(updateWhere).toHaveBeenCalled();
	});

	it("creates admin user if missing", async () => {
		usersFindFirst.mockResolvedValue(null);
		communitiesFindFirst.mockResolvedValue({ id: "community-id" });

		await ensureBootstrapData();

		expect(insert).toHaveBeenCalled();
		expect(insertValues).toHaveBeenCalled();
	});

	it("creates community if missing", async () => {
		usersFindFirst.mockResolvedValue({ role: "administrator" });
		communitiesFindFirst.mockResolvedValue(null);

		await ensureBootstrapData();

		expect(insert).toHaveBeenCalled();
		expect(insertValues).toHaveBeenCalled();
	});

	it("is idempotent when admin and community exist", async () => {
		usersFindFirst.mockResolvedValue({ role: "administrator" });
		communitiesFindFirst.mockResolvedValue({ id: "community-id" });

		await ensureBootstrapData();

		expect(insert).not.toHaveBeenCalled();
		expect(update).not.toHaveBeenCalled();
	});
});
