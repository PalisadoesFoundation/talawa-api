import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { notificationTemplatesTable } from "~/src/drizzle/tables/NotificationTemplate";
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
	};
	drizzleClient: {
		query: {
			usersTable: {
				findFirst: ReturnType<typeof vi.fn>;
			};
			communitiesTable: {
				findFirst: ReturnType<typeof vi.fn>;
			};
			notificationTemplatesTable: {
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

	describe("notification template seeding", () => {
		it("should insert notification templates when table is empty", async () => {
			// Track inserted values
			const insertedValues: unknown[] = [];
			mockValues.mockImplementation((values) => {
				insertedValues.push(values);
				return {
					onConflictDoNothing: mockOnConflictDoNothing,
				};
			});

			await seedInitialDataPlugin(mockFastify as FastifyInstance, {});

			// Verify insert was called for each template
			expect(mockInsert).toHaveBeenCalledTimes(12);
			expect(mockInsert).toHaveBeenCalledWith(notificationTemplatesTable);

			// Verify onConflictDoNothing was called for each template with correct target
			expect(mockOnConflictDoNothing).toHaveBeenCalledTimes(12);
			expect(mockOnConflictDoNothing).toHaveBeenCalledWith({
				target: [
					notificationTemplatesTable.eventType,
					notificationTemplatesTable.channelType,
				],
			});

			// Verify returning was called for each template
			expect(mockReturning).toHaveBeenCalledTimes(12);

			// Verify the first template was inserted with correct structure
			const firstInsert = insertedValues[0] as Record<string, unknown>;
			expect(firstInsert).toBeDefined();
			expect(firstInsert.name).toBe("Post Created");
			expect(firstInsert.eventType).toBe("post_created");
			expect(firstInsert.channelType).toBe("in_app");
			expect(firstInsert.title).toBe("New Post from {organizationName}");
			expect(firstInsert.body).toBe(
				"{authorName} created a new post: {postCaption}",
			);
			expect(firstInsert.linkedRouteName).toBe("PostDetails");
		});

		it("should be idempotent - use onConflictDoNothing to prevent duplicates", async () => {
			await seedInitialDataPlugin(mockFastify as FastifyInstance, {});

			// Verify insert was called for each template
			expect(mockInsert).toHaveBeenCalledTimes(12);

			// Verify onConflictDoNothing was called for each template
			expect(mockOnConflictDoNothing).toHaveBeenCalledTimes(12);

			// Second run: should still attempt inserts (onConflictDoNothing handles conflicts)
			vi.clearAllMocks();
			mockOnConflictDoNothing.mockClear();
			mockValues.mockReturnValue({
				onConflictDoNothing: mockOnConflictDoNothing,
			});

			await seedInitialDataPlugin(mockFastify as FastifyInstance, {});

			// Verify insert was still called (onConflictDoNothing prevents duplicates)
			expect(mockInsert).toHaveBeenCalledTimes(12);
			expect(mockOnConflictDoNothing).toHaveBeenCalledTimes(12);
		});

		it("should handle missing notificationTemplatesTable gracefully", async () => {
			// Simulate table not existing in schema
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

		it("should insert all expected notification templates", async () => {
			const expectedTemplates = [
				{
					name: "Post Created",
					eventType: "post_created",
					channelType: "in_app",
				},
				{
					name: "Event Created",
					eventType: "event_created",
					channelType: "in_app",
				},
				{
					name: "Membership Accepted",
					eventType: "membership_request_accepted",
					channelType: "email",
				},
				{
					name: "Membership Rejected",
					eventType: "membership_request_rejected",
					channelType: "in_app",
				},
				{
					name: "Join Request Submitted",
					eventType: "join_request_submitted",
					channelType: "in_app",
				},
				{
					name: "Join Request Submitted Email",
					eventType: "join_request_submitted",
					channelType: "email",
				},
				{
					name: "New Member Joined",
					eventType: "new_member_joined",
					channelType: "in_app",
				},
				{
					name: "User Blocked",
					eventType: "user_blocked",
					channelType: "in_app",
				},
				{
					name: "Fund Created",
					eventType: "fund_created",
					channelType: "in_app",
				},
				{
					name: "Fund Campaign Created",
					eventType: "fund_campaign_created",
					channelType: "in_app",
				},
				{
					name: "Fund Campaign Pledge Created",
					eventType: "fund_campaign_pledge_created",
					channelType: "in_app",
				},
				{
					name: "Event Invite",
					eventType: "send_event_invite",
					channelType: "email",
				},
			];

			const insertedValues: unknown[] = [];
			mockValues.mockImplementation((values) => {
				insertedValues.push(values);
				return {
					onConflictDoNothing: mockOnConflictDoNothing,
				};
			});

			await seedInitialDataPlugin(mockFastify as FastifyInstance, {});

			// Verify all templates were inserted
			expect(insertedValues).toHaveLength(12);

			// Verify each template matches expected structure
			for (let i = 0; i < expectedTemplates.length; i++) {
				const inserted = insertedValues[i] as Record<string, unknown>;
				const expected = expectedTemplates[i];
				expect(inserted).toBeDefined();
				expect(expected).toBeDefined();

				if (expected) {
					expect(inserted.name).toBe(expected.name);
					expect(inserted.eventType).toBe(expected.eventType);
					expect(inserted.channelType).toBe(expected.channelType);
				}
			}
		});

		it("should use onConflictDoNothing to prevent duplicates for same (eventType, channelType) pair", async () => {
			const insertedValues: unknown[] = [];
			mockValues.mockImplementation((values) => {
				insertedValues.push(values);
				return {
					onConflictDoNothing: mockOnConflictDoNothing,
				};
			});

			await seedInitialDataPlugin(mockFastify as FastifyInstance, {});

			// Should attempt to insert all 12 templates
			expect(insertedValues).toHaveLength(12);
			expect(mockInsert).toHaveBeenCalledTimes(12);

			// Verify onConflictDoNothing was called with correct target for conflict handling
			expect(mockOnConflictDoNothing).toHaveBeenCalledTimes(12);
			for (const call of mockOnConflictDoNothing.mock.calls) {
				expect(call[0]).toEqual({
					target: [
						notificationTemplatesTable.eventType,
						notificationTemplatesTable.channelType,
					],
				});
			}

			// Verify returning was called for each template
			expect(mockReturning).toHaveBeenCalledTimes(12);
		});

		it("should log 'already exists' when template conflicts occur", async () => {
			// Mock returning to return empty array (simulating conflict - no insert occurred)
			mockReturning.mockResolvedValue([]);

			await seedInitialDataPlugin(mockFastify as FastifyInstance, {});

			// Verify "already exists" log was called for each template
			expect(mockFastify.log.info).toHaveBeenCalledWith(
				expect.stringContaining("Template already exists:"),
			);
			// Count how many times "already exists" was logged
			const alreadyExistsCalls = (
				mockFastify.log.info as ReturnType<typeof vi.fn>
			).mock.calls.filter((call) =>
				call[0]?.toString().includes("Template already exists:"),
			);
			expect(alreadyExistsCalls).toHaveLength(12);
		});

		it("should log 'Seeded template' when insert succeeds", async () => {
			// Mock returning to return array with id (simulating successful insert)
			mockReturning.mockResolvedValue([{ id: "test-id" }]);

			await seedInitialDataPlugin(mockFastify as FastifyInstance, {});

			// Verify "Seeded template" log was called for each template
			expect(mockFastify.log.info).toHaveBeenCalledWith(
				expect.stringContaining("Seeded template:"),
			);
			// Count how many times "Seeded template" was logged
			const seededCalls = (
				mockFastify.log.info as ReturnType<typeof vi.fn>
			).mock.calls.filter((call) =>
				call[0]?.toString().includes("Seeded template:"),
			);
			expect(seededCalls).toHaveLength(12);
		});
	});
});
