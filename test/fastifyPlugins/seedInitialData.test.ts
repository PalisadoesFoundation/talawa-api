import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { communitiesTable } from "~/src/drizzle/tables/communities";
import { notificationTemplatesTable } from "~/src/drizzle/tables/NotificationTemplate";
import { usersTable } from "~/src/drizzle/tables/users";
import seedInitialDataPlugin from "~/src/fastifyPlugins/seedInitialData";

type MockFastifyInstance = Partial<FastifyInstance> & {
	log: {
		info: ReturnType<typeof vi.fn>;
		warn: ReturnType<typeof vi.fn>;
		error: ReturnType<typeof vi.fn>;
	};
	envConfig: {
		API_ADMINISTRATOR_USER_EMAIL_ADDRESS: string;
		API_ADMINISTRATOR_USER_PASSWORD: string;
		API_ADMINISTRATOR_USER_NAME: string;
		API_COMMUNITY_NAME: string;
		API_COMMUNITY_FACEBOOK_URL: string | null;
		API_COMMUNITY_GITHUB_URL: string | null;
		API_COMMUNITY_INACTIVITY_TIMEOUT_DURATION: number;
		API_COMMUNITY_INSTAGRAM_URL: string | null;
		API_COMMUNITY_LINKEDIN_URL: string | null;
		API_COMMUNITY_REDDIT_URL: string | null;
		API_COMMUNITY_SLACK_URL: string | null;
		API_COMMUNITY_WEBSITE_URL: string | null;
		API_COMMUNITY_X_URL: string | null;
		API_COMMUNITY_YOUTUBE_URL: string | null;
		ENABLE_NOTIFICATION_TEMPLATE_SEEDING?: boolean;
	};
	drizzleClient: {
		query: {
			usersTable: {
				findFirst: ReturnType<typeof vi.fn>;
			};
			communitiesTable: {
				findFirst: ReturnType<typeof vi.fn>;
			};
			notificationTemplatesTable?: {
				findFirst: ReturnType<typeof vi.fn>;
			};
		};
		insert: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
	};
};

describe("seedInitialData Plugin - Notification Templates", () => {
	let mockFastify: MockFastifyInstance;
	let mockInsert: ReturnType<typeof vi.fn>;
	let mockValues: ReturnType<typeof vi.fn>;
	let mockOnConflictDoNothing: ReturnType<typeof vi.fn>;
	let mockReturning: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.clearAllMocks();

		// Mock returning to return array with id (simulating successful insert)
		mockReturning = vi.fn().mockResolvedValue([{ id: "test-id" }]);
		mockOnConflictDoNothing = vi.fn().mockReturnValue({
			returning: mockReturning,
		});
		mockValues = vi.fn().mockReturnValue({
			onConflictDoNothing: mockOnConflictDoNothing,
		});
		mockInsert = vi.fn().mockReturnValue({
			values: mockValues,
		});

		mockFastify = {
			log: {
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
			},
			envConfig: {
				API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "admin@test.com",
				API_ADMINISTRATOR_USER_PASSWORD: "password",
				API_ADMINISTRATOR_USER_NAME: "Admin User",
				API_COMMUNITY_NAME: "Test Community",
				API_COMMUNITY_FACEBOOK_URL: null,
				API_COMMUNITY_GITHUB_URL: null,
				API_COMMUNITY_INACTIVITY_TIMEOUT_DURATION: 3600000,
				API_COMMUNITY_INSTAGRAM_URL: null,
				API_COMMUNITY_LINKEDIN_URL: null,
				API_COMMUNITY_REDDIT_URL: null,
				API_COMMUNITY_SLACK_URL: null,
				API_COMMUNITY_WEBSITE_URL: null,
				API_COMMUNITY_X_URL: null,
				API_COMMUNITY_YOUTUBE_URL: null,
				ENABLE_NOTIFICATION_TEMPLATE_SEEDING: false,
			},
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: vi.fn().mockResolvedValue({
							role: "administrator",
						}),
					},
					communitiesTable: {
						findFirst: vi.fn().mockResolvedValue({
							logoMimeType: null,
						}),
					},
					notificationTemplatesTable: {},
				},
				insert: mockInsert,
				update: vi.fn(),
			},
		} as MockFastifyInstance;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("notification template seeding feature flag", () => {
		it("should skip seeding when ENABLE_NOTIFICATION_TEMPLATE_SEEDING is false", async () => {
			mockFastify.envConfig.ENABLE_NOTIFICATION_TEMPLATE_SEEDING = false;

			await seedInitialDataPlugin(mockFastify as FastifyInstance, {});

			// Should not attempt to insert
			expect(mockInsert).not.toHaveBeenCalled();
			expect(mockFastify.log.info).not.toHaveBeenCalledWith(
				expect.stringContaining("Seeded template:"),
			);
		});

		it("should skip seeding when ENABLE_NOTIFICATION_TEMPLATE_SEEDING is undefined", async () => {
			mockFastify.envConfig.ENABLE_NOTIFICATION_TEMPLATE_SEEDING = undefined;

			await seedInitialDataPlugin(mockFastify as FastifyInstance, {});

			// Should not attempt to insert
			expect(mockInsert).not.toHaveBeenCalled();
		});

		it("should seed templates when ENABLE_NOTIFICATION_TEMPLATE_SEEDING is true", async () => {
			mockFastify.envConfig.ENABLE_NOTIFICATION_TEMPLATE_SEEDING = true;

			await seedInitialDataPlugin(mockFastify as FastifyInstance, {});

			// Should attempt to insert 12 templates
			expect(mockInsert).toHaveBeenCalledTimes(12);
			expect(mockInsert).toHaveBeenCalledWith(notificationTemplatesTable);
			expect(mockOnConflictDoNothing).toHaveBeenCalledTimes(12);
			expect(mockOnConflictDoNothing).toHaveBeenCalledWith({
				target: [
					notificationTemplatesTable.eventType,
					notificationTemplatesTable.channelType,
				],
			});
		});

		it("should handle missing notificationTemplatesTable gracefully when flag is enabled", async () => {
			mockFastify.envConfig.ENABLE_NOTIFICATION_TEMPLATE_SEEDING = true;
			(
				mockFastify.drizzleClient.query as unknown as {
					notificationTemplatesTable?: { findFirst: ReturnType<typeof vi.fn> };
				}
			).notificationTemplatesTable = undefined;

			await seedInitialDataPlugin(mockFastify as FastifyInstance, {});

			// Should log warning and skip seeding
			expect(mockFastify.log.warn).toHaveBeenCalledWith(
				"Notification templates table not found in drizzle schema. Skipping seeding.",
			);

			// Should not attempt to insert
			expect(mockInsert).not.toHaveBeenCalled();
		});

		it("should log 'Seeded template' when insert succeeds", async () => {
			mockFastify.envConfig.ENABLE_NOTIFICATION_TEMPLATE_SEEDING = true;
			mockReturning.mockResolvedValue([{ id: "test-id" }]);

			await seedInitialDataPlugin(mockFastify as FastifyInstance, {});

			// Verify "Seeded template" log was called for each template
			const seededCalls = (
				mockFastify.log.info as ReturnType<typeof vi.fn>
			).mock.calls.filter((call) =>
				call[0]?.toString().includes("Seeded template:"),
			);
			expect(seededCalls).toHaveLength(12);
		});

		it("should log 'Template already exists' when onConflictDoNothing prevents insert", async () => {
			mockFastify.envConfig.ENABLE_NOTIFICATION_TEMPLATE_SEEDING = true;
			// Mock returning to return empty array (simulating conflict - no insert occurred)
			mockReturning.mockResolvedValue([]);

			await seedInitialDataPlugin(mockFastify as FastifyInstance, {});

			// Verify "already exists" log was called for each template
			const alreadyExistsCalls = (
				mockFastify.log.info as ReturnType<typeof vi.fn>
			).mock.calls.filter((call) =>
				call[0]?.toString().includes("Template already exists:"),
			);
			expect(alreadyExistsCalls).toHaveLength(12);
		});

		it("should call notificationTemplatesTableInsertSchema.parse for each template", async () => {
			mockFastify.envConfig.ENABLE_NOTIFICATION_TEMPLATE_SEEDING = true;

			// Spy on the parse function
			const { notificationTemplatesTableInsertSchema } = await import(
				"~/src/drizzle/tables/NotificationTemplate"
			);
			const parseSpy = vi
				.spyOn(notificationTemplatesTableInsertSchema, "parse")
				.mockImplementation(
					(x: unknown) =>
						x as ReturnType<
							typeof notificationTemplatesTableInsertSchema.parse
						>,
				);

			// Track inserted values to verify parse was called
			const insertedValues: unknown[] = [];
			mockValues.mockImplementation((values) => {
				insertedValues.push(values);
				return {
					onConflictDoNothing: mockOnConflictDoNothing,
				};
			});

			await seedInitialDataPlugin(mockFastify as FastifyInstance, {});

			// Verify parse was called for each template (12 templates)
			expect(parseSpy).toHaveBeenCalledTimes(12);
			expect(insertedValues).toHaveLength(12);
			// Verify insert was called with notificationTemplatesTable
			expect(mockInsert).toHaveBeenCalledWith(notificationTemplatesTable);

			parseSpy.mockRestore();
		});

		it("should surface error when template insert chain fails", async () => {
			mockFastify.envConfig.ENABLE_NOTIFICATION_TEMPLATE_SEEDING = true;

			const insertError = new Error("Insert failed");
			mockReturning.mockRejectedValueOnce(insertError);

			await expect(
				seedInitialDataPlugin(mockFastify as FastifyInstance, {}),
			).rejects.toThrow("Insert failed");
		});
	});

	describe("administrator user seeding", () => {
		it("should create administrator user when user does not exist", async () => {
			mockFastify.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			const mockUserValues = vi.fn().mockReturnValue({
				values: vi.fn(),
			});
			mockFastify.drizzleClient.insert = vi.fn().mockReturnValue({
				values: mockUserValues,
			});

			await seedInitialDataPlugin(mockFastify as FastifyInstance, {});

			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Administrator user does not exist in the database. Creating the administrator.",
			);
			expect(mockFastify.drizzleClient.insert).toHaveBeenCalledWith(usersTable);
			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Successfully created the administrator in the database.",
			);
		});

		it("should update user role when user exists with invalid role", async () => {
			mockFastify.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});

			mockFastify.drizzleClient.update = vi.fn().mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(undefined),
				}),
			});

			await seedInitialDataPlugin(mockFastify as FastifyInstance, {});

			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Administrator user already exists in the database with an invalid role. Assigning the correct role to the administrator user.",
			);
			expect(mockFastify.drizzleClient.update).toHaveBeenCalledWith(usersTable);
			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Successfully assigned the correct role to the administrator user.",
			);
		});

		it("should skip user creation when user already exists with correct role", async () => {
			mockFastify.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});

			await seedInitialDataPlugin(mockFastify as FastifyInstance, {});

			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Administrator user already exists in the database. Skipping, the administrator creation.",
			);
			expect(mockFastify.drizzleClient.insert).not.toHaveBeenCalledWith(
				usersTable,
			);
		});

		it("should throw error when user lookup fails", async () => {
			const error = new Error("Database connection failed");
			mockFastify.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				error,
			);

			await expect(
				seedInitialDataPlugin(mockFastify as FastifyInstance, {}),
			).rejects.toThrow(
				"Failed to check if the administrator user already exists",
			);

			expect(mockFastify.log.error).not.toHaveBeenCalled();
		});

		it("should throw error when user update fails", async () => {
			mockFastify.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});

			const error = new Error("Update failed");
			mockFastify.drizzleClient.update = vi.fn().mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockRejectedValue(error),
				}),
			});

			await expect(
				seedInitialDataPlugin(mockFastify as FastifyInstance, {}),
			).rejects.toThrow(
				"Failed to assign the correct role to the existing administrator user",
			);
		});

		it("should throw error when user creation fails", async () => {
			mockFastify.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			const error = new Error("Insert failed");
			mockFastify.drizzleClient.insert = vi.fn().mockReturnValue({
				values: vi.fn().mockRejectedValue(error),
			});

			await expect(
				seedInitialDataPlugin(mockFastify as FastifyInstance, {}),
			).rejects.toThrow("Failed to create the administrator in the database");
		});
	});

	describe("community seeding", () => {
		it("should create community when community does not exist", async () => {
			mockFastify.drizzleClient.query.communitiesTable.findFirst.mockResolvedValue(
				undefined,
			);

			mockFastify.drizzleClient.insert = vi.fn().mockReturnValue({
				values: vi.fn().mockResolvedValue(undefined),
			});

			await seedInitialDataPlugin(mockFastify as FastifyInstance, {});

			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Community does not exist in the database. Creating the community.",
			);
			expect(mockFastify.drizzleClient.insert).toHaveBeenCalledWith(
				communitiesTable,
			);
			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Successfully created the community in the database.",
			);
		});

		it("should skip community creation when community already exists", async () => {
			mockFastify.drizzleClient.query.communitiesTable.findFirst.mockResolvedValue(
				{
					logoMimeType: null,
				},
			);

			await seedInitialDataPlugin(mockFastify as FastifyInstance, {});

			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Community already exists in the database. Skipping, the community creation.",
			);
			// Should not insert community
			const communityInsertCalls = (
				mockFastify.drizzleClient.insert as ReturnType<typeof vi.fn>
			).mock.calls.filter((call) => call[0] === communitiesTable);
			expect(communityInsertCalls).toHaveLength(0);
		});

		it("should throw error when community lookup fails", async () => {
			const error = new Error("Database connection failed");
			mockFastify.drizzleClient.query.communitiesTable.findFirst.mockRejectedValue(
				error,
			);

			await expect(
				seedInitialDataPlugin(mockFastify as FastifyInstance, {}),
			).rejects.toThrow(
				"Failed to check if the community already exists in the database",
			);
		});

		it("should throw error when community creation fails", async () => {
			mockFastify.drizzleClient.query.communitiesTable.findFirst.mockResolvedValue(
				undefined,
			);

			const error = new Error("Insert failed");
			mockFastify.drizzleClient.insert = vi.fn().mockReturnValue({
				values: vi.fn().mockRejectedValue(error),
			});

			await expect(
				seedInitialDataPlugin(mockFastify as FastifyInstance, {}),
			).rejects.toThrow("Failed to create the community in the database");
		});
	});
});
