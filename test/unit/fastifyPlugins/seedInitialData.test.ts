import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("fastify-plugin", () => ({
	default: vi.fn((fn) => fn),
}));

vi.mock("@node-rs/argon2", () => ({
	hash: vi.fn(),
}));

vi.mock("uuidv7", () => ({
	uuidv7: vi.fn(),
}));

import { hash } from "@node-rs/argon2";
import { uuidv7 } from "uuidv7";
import seedInitialData from "~/src/fastifyPlugins/seedInitialData";
import { createMockDrizzleClient } from "test/_Mocks_/drizzleClientMock";
import { communitiesTable } from "~/src/drizzle/tables/communities";
import { usersTable } from "~/src/drizzle/tables/users";

type MockDrizzleClient = ReturnType<typeof createMockDrizzleClient>;

type MockFastifyInstance = Partial<FastifyInstance> & {
	log: {
		info: ReturnType<typeof vi.fn>;
	};
	drizzleClient: MockDrizzleClient;
	envConfig: {
		API_ADMINISTRATOR_USER_EMAIL_ADDRESS: string;
		API_ADMINISTRATOR_USER_NAME: string;
		API_ADMINISTRATOR_USER_PASSWORD: string;
		API_COMMUNITY_FACEBOOK_URL: string | undefined;
		API_COMMUNITY_GITHUB_URL: string | undefined;
		API_COMMUNITY_INACTIVITY_TIMEOUT_DURATION: number;
		API_COMMUNITY_INSTAGRAM_URL: string | undefined;
		API_COMMUNITY_LINKEDIN_URL: string | undefined;
		API_COMMUNITY_NAME: string;
		API_COMMUNITY_REDDIT_URL: string | undefined;
		API_COMMUNITY_SLACK_URL: string | undefined;
		API_COMMUNITY_WEBSITE_URL: string | undefined;
		API_COMMUNITY_X_URL: string | undefined;
		API_COMMUNITY_YOUTUBE_URL: string | undefined;
	};
};

describe("seedInitialData plugin", () => {
	let mockFastify: MockFastifyInstance;

	beforeEach(() => {
		vi.clearAllMocks();

		(hash as ReturnType<typeof vi.fn>).mockResolvedValue(
			"$argon2id$v=19$m=65536$hashedpassword",
		);
		(uuidv7 as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
			"019478a1-bcc8-7da0-92ee-123456789abc",
		);

		mockFastify = {
			log: {
				info: vi.fn(),
			},
			drizzleClient: createMockDrizzleClient(),
			envConfig: {
				API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "admin@example.com",
				API_ADMINISTRATOR_USER_NAME: "Test Admin",
				API_ADMINISTRATOR_USER_PASSWORD: "testPassword123",
				API_COMMUNITY_FACEBOOK_URL: undefined,
				API_COMMUNITY_GITHUB_URL: undefined,
				API_COMMUNITY_INACTIVITY_TIMEOUT_DURATION: 900,
				API_COMMUNITY_INSTAGRAM_URL: undefined,
				API_COMMUNITY_LINKEDIN_URL: undefined,
				API_COMMUNITY_NAME: "Test Community",
				API_COMMUNITY_REDDIT_URL: undefined,
				API_COMMUNITY_SLACK_URL: undefined,
				API_COMMUNITY_WEBSITE_URL: undefined,
				API_COMMUNITY_X_URL: undefined,
				API_COMMUNITY_YOUTUBE_URL: undefined,
			},
		};
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Administrator User Seeding", () => {
		it("should skip creation when administrator already exists with correct role", async () => {
			mockFastify.drizzleClient.query.usersTable.findFirst.mockImplementation(
				async (options?: {
					where?: (
						fields: Record<string, unknown>,
						operators: Record<string, (...args: unknown[]) => unknown>,
					) => unknown;
				}) => {
					if (options?.where) {
						options.where(
							{ emailAddress: "email_field" },
							{ eq: vi.fn() },
						);
					}
					return { role: "administrator" };
				},
			);
			mockFastify.drizzleClient.query.communitiesTable.findFirst.mockResolvedValue(
				{
					logoMimeType: "image/png",
				},
			);

			await seedInitialData(mockFastify as unknown as FastifyInstance);

			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Checking if the administrator user already exists in the database.",
			);
			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Administrator user already exists in the database. Skipping, the administrator creation.",
			);
			expect(mockFastify.drizzleClient.update).not.toHaveBeenCalled();
			expect(mockFastify.drizzleClient.insert).not.toHaveBeenCalled();
		});

		it("should update role when administrator exists with incorrect role", async () => {
			mockFastify.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});
			mockFastify.drizzleClient.query.communitiesTable.findFirst.mockResolvedValue(
				{
					logoMimeType: "image/png",
				},
			);

			await seedInitialData(mockFastify as unknown as FastifyInstance);

			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Administrator user already exists in the database with an invalid role. Assigning the correct role to the administrator user.",
			);
			expect(mockFastify.drizzleClient.update).toHaveBeenCalledWith(
				usersTable,
			);
			const updateChain =
				mockFastify.drizzleClient.update.mock.results[0]?.value;
			expect(updateChain.set).toHaveBeenCalledWith({
				role: "administrator",
			});
			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Successfully assigned the correct role to the administrator user.",
			);
		});

		it("should create new administrator when user does not exist", async () => {
			mockFastify.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);
			mockFastify.drizzleClient.query.communitiesTable.findFirst.mockResolvedValue(
				{
					logoMimeType: "image/png",
				},
			);

			await seedInitialData(mockFastify as unknown as FastifyInstance);

			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Administrator user does not exist in the database. Creating the administrator.",
			);
			expect(hash).toHaveBeenCalledWith("testPassword123");
			expect(uuidv7).toHaveBeenCalled();
			expect(mockFastify.drizzleClient.insert).toHaveBeenCalledWith(
				usersTable,
			);
			const insertChain =
				mockFastify.drizzleClient.insert.mock.results[0]?.value;
			expect(insertChain.values).toHaveBeenCalledWith(
				expect.objectContaining({
					emailAddress: "admin@example.com",
					name: "Test Admin",
					role: "administrator",
					passwordHash: "$argon2id$v=19$m=65536$hashedpassword",
					id: "019478a1-bcc8-7da0-92ee-123456789abc",
					creatorId: "019478a1-bcc8-7da0-92ee-123456789abc",
					isEmailAddressVerified: true,
				}),
			);
			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Successfully created the administrator in the database.",
			);
		});

		it("should throw when user query fails", async () => {
			const dbError = new Error("Database connection lost");
			mockFastify.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				dbError,
			);

			await expect(
				seedInitialData(mockFastify as unknown as FastifyInstance),
			).rejects.toThrow(
				"Failed to check if the administrator user already exists in the database.",
			);
		});

		it("should throw when user role update fails", async () => {
			mockFastify.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});
			mockFastify.drizzleClient.update.mockImplementation(() => {
				throw new Error("Update failed");
			});

			await expect(
				seedInitialData(mockFastify as unknown as FastifyInstance),
			).rejects.toThrow(
				"Failed to assign the correct role to the existing administrator user.",
			);
		});

		it("should throw when user insert fails", async () => {
			mockFastify.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);
			mockFastify.drizzleClient.insert.mockImplementation(() => {
				throw new Error("Insert failed");
			});

			await expect(
				seedInitialData(mockFastify as unknown as FastifyInstance),
			).rejects.toThrow(
				"Failed to create the administrator in the database.",
			);
		});
	});

	describe("Community Seeding", () => {
		beforeEach(() => {
			mockFastify.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});
		});

		it("should skip creation when community already exists", async () => {
			mockFastify.drizzleClient.query.communitiesTable.findFirst.mockResolvedValue(
				{
					logoMimeType: "image/png",
				},
			);

			await seedInitialData(mockFastify as unknown as FastifyInstance);

			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Checking if the community already exists in the database.",
			);
			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Community already exists in the database. Skipping, the community creation.",
			);
			expect(mockFastify.drizzleClient.insert).not.toHaveBeenCalled();
		});

		it("should create community when it does not exist", async () => {
			mockFastify.drizzleClient.query.communitiesTable.findFirst.mockResolvedValue(
				undefined,
			);

			await seedInitialData(mockFastify as unknown as FastifyInstance);

			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Community does not exist in the database. Creating the community.",
			);
			expect(mockFastify.drizzleClient.insert).toHaveBeenCalledWith(
				communitiesTable,
			);
			const insertChain =
				mockFastify.drizzleClient.insert.mock.results[0]?.value;
			expect(insertChain.values).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "Test Community",
					inactivityTimeoutDuration: 900,
				}),
			);
			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Successfully created the community in the database.",
			);
		});

		it("should throw when community query fails", async () => {
			mockFastify.drizzleClient.query.communitiesTable.findFirst.mockRejectedValue(
				new Error("Query failed"),
			);

			await expect(
				seedInitialData(mockFastify as unknown as FastifyInstance),
			).rejects.toThrow(
				"Failed to check if the community already exists in the database.",
			);
		});

		it("should throw when community insert fails", async () => {
			mockFastify.drizzleClient.query.communitiesTable.findFirst.mockResolvedValue(
				undefined,
			);
			mockFastify.drizzleClient.insert.mockImplementation(() => {
				throw new Error("Insert failed");
			});

			await expect(
				seedInitialData(mockFastify as unknown as FastifyInstance),
			).rejects.toThrow(
				"Failed to create the community in the database.",
			);
		});
	});
});
