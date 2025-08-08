import { reset } from "drizzle-seed";
import { uuidv7 } from "uuidv7";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "~/src/drizzle/schema";
import { notificationTemplatesTable } from "~/src/drizzle/tables/NotificationTemplate";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { usersTable } from "~/src/drizzle/tables/users";
import type { GraphQLContext } from "~/src/graphql/context";
import {
	NotificationChannelType,
	NotificationEngine,
	NotificationTargetType,
	type NotificationVariables,
} from "~/src/graphql/types/Notification/Notification_engine";
import { server } from "../../../server";

describe("NotificationEngine Integration", () => {
	let testTemplateId: string;
	let testUserId: string;
	let testOrgId: string;
	let testAdminId: string;
	let testMemberId: string;

	beforeEach(async () => {
		await reset(server.drizzleClient, schema);

		testTemplateId = uuidv7();
		testUserId = uuidv7();
		testOrgId = uuidv7();
		testAdminId = uuidv7();
		testMemberId = uuidv7();

		await server.drizzleClient.insert(notificationTemplatesTable).values([
			{
				id: testTemplateId,
				name: "Test Template",
				eventType: "test_event",
				channelType: NotificationChannelType.IN_APP,
				title: "Hello {name}",
				body: "Welcome to {organizationName}, {name}! Your ID is {userId}.",
				linkedRouteName: "/test-route",
			},
			{
				id: uuidv7(),
				name: "Post Created Template",
				eventType: "post_created",
				channelType: NotificationChannelType.IN_APP,
				title: "New Post: {postCaption}",
				body: "{authorName} created a new post in {organizationName}",
				linkedRouteName: "/posts",
			},
			{
				id: uuidv7(),
				name: "Email Template",
				eventType: "test_event",
				channelType: NotificationChannelType.EMAIL,
				title: "Email: {subject}",
				body: "This is an email notification for {name}",
				linkedRouteName: "/email",
			},
		]);

		await server.drizzleClient.insert(usersTable).values([
			{
				id: testUserId,
				name: "Test User",
				emailAddress: "user@test.com",
				isEmailAddressVerified: true,
				passwordHash: "hashedpassword123",
				role: "regular",
			},
			{
				id: testAdminId,
				name: "Admin User",
				emailAddress: "admin@test.com",
				isEmailAddressVerified: true,
				passwordHash: "hashedpassword123",
				role: "administrator",
			},
			{
				id: testMemberId,
				name: "Member User",
				emailAddress: "member@test.com",
				isEmailAddressVerified: true,
				passwordHash: "hashedpassword123",
				role: "regular",
			},
		]);

		await server.drizzleClient.insert(organizationsTable).values([
			{
				id: testOrgId,
				name: "Test Organization",
				description: "A test organization",
				creatorId: testAdminId,
			},
		]);

		await server.drizzleClient.insert(organizationMembershipsTable).values([
			{
				organizationId: testOrgId,
				memberId: testAdminId,
				role: "administrator",
			},
			{
				organizationId: testOrgId,
				memberId: testMemberId,
				role: "regular",
			},
			{
				organizationId: testOrgId,
				memberId: testUserId,
				role: "regular",
			},
		]);
	});

	describe("createNotification", () => {
		it("should create notification log and audience entries for USER target type", async () => {
			const ctx = {
				drizzleClient: server.drizzleClient,
				currentClient: { isAuthenticated: true, user: { id: testAdminId } }, // Use existing user
				log: server.log,
			} as unknown as GraphQLContext;
			const engine = new NotificationEngine(ctx);

			const variables: NotificationVariables = {
				name: "Alice",
				organizationName: "Test Org",
				userId: testUserId,
			};

			const notificationId = await engine.createNotification(
				"test_event",
				variables,
				{
					targetType: NotificationTargetType.USER,
					targetIds: [testUserId, testAdminId],
				},
			);

			const logs =
				await server.drizzleClient.query.notificationLogsTable.findMany();
			expect(logs).toHaveLength(1);

			const logEntry = logs[0];
			expect(logEntry).toBeDefined();
			if (logEntry) {
				expect(logEntry.id).toBe(notificationId);
				expect(logEntry.eventType).toBe("test_event");
				expect(logEntry.templateId).toBe(testTemplateId);
				expect(logEntry.sender).toBe(testAdminId);
				expect(logEntry.channel).toBe(NotificationChannelType.IN_APP);
				expect(logEntry.status).toBe("delivered");
				expect(logEntry.navigation).toBe("/test-route");
				const renderedContent = logEntry.renderedContent as {
					title: string;
					body: string;
				};
				expect(renderedContent.title).toBe("Hello Alice");
				expect(renderedContent.body).toBe(
					`Welcome to Test Org, Alice! Your ID is ${testUserId}.`,
				);

				expect(logEntry.variables).toEqual(variables);
			}

			const audiences =
				await server.drizzleClient.query.notificationAudienceTable.findMany();
			expect(audiences).toHaveLength(1);

			const audEntry = audiences[0];
			expect(audEntry).toBeDefined();
			if (audEntry) {
				expect(audEntry.userId).toBe(testUserId);
				expect(audEntry.notificationId).toBe(notificationId);
				expect(audEntry.isRead).toBe(false);
			}
		});

		it("should create notification for ORGANIZATION target type", async () => {
			const ctx = {
				drizzleClient: server.drizzleClient,
				currentClient: { isAuthenticated: true, user: { id: testAdminId } },
				log: server.log,
			} as unknown as GraphQLContext;
			const engine = new NotificationEngine(ctx);

			const variables: NotificationVariables = {
				name: "Organization Members",
				organizationName: "Test Organization",
			};

			await engine.createNotification("test_event", variables, {
				targetType: NotificationTargetType.ORGANIZATION,
				targetIds: [testOrgId],
			});

			const logs =
				await server.drizzleClient.query.notificationLogsTable.findMany();
			expect(logs).toHaveLength(1);

			const audiences =
				await server.drizzleClient.query.notificationAudienceTable.findMany();
			expect(audiences).toHaveLength(2);

			const audienceUserIds = audiences.map((a) => a.userId).sort();
			expect(audienceUserIds).toEqual([testMemberId, testUserId].sort());
		});

		it("should create notification for ORGANIZATION_ADMIN target type", async () => {
			const ctx = {
				drizzleClient: server.drizzleClient,
				currentClient: { isAuthenticated: true, user: { id: testUserId } },
				log: server.log,
			} as unknown as GraphQLContext;
			const engine = new NotificationEngine(ctx);

			await engine.createNotification(
				"test_event",
				{ name: "Admins Only" },
				{
					targetType: NotificationTargetType.ORGANIZATION_ADMIN,
					targetIds: [testOrgId],
				},
			);

			const logs =
				await server.drizzleClient.query.notificationLogsTable.findMany();
			expect(logs).toHaveLength(1);

			// Verify audience entries (only org admins)
			const audiences =
				await server.drizzleClient.query.notificationAudienceTable.findMany();
			expect(audiences).toHaveLength(1);

			const audEntry = audiences[0];
			expect(audEntry).toBeDefined();
			if (audEntry) {
				expect(audEntry.userId).toBe(testAdminId);
			}
		});

		it("should create notification for ADMIN target type", async () => {
			const ctx = {
				drizzleClient: server.drizzleClient,
				currentClient: { isAuthenticated: true, user: { id: testUserId } },
				log: server.log,
			} as unknown as GraphQLContext;
			const engine = new NotificationEngine(ctx);

			await engine.createNotification(
				"test_event",
				{ name: "System Admins" },
				{
					targetType: NotificationTargetType.ADMIN,
					targetIds: [],
				},
			);

			const logs =
				await server.drizzleClient.query.notificationLogsTable.findMany();
			expect(logs).toHaveLength(1);

			const audiences =
				await server.drizzleClient.query.notificationAudienceTable.findMany();
			expect(audiences).toHaveLength(1);

			const audEntry = audiences[0];
			expect(audEntry).toBeDefined();
			if (audEntry) {
				expect(audEntry.userId).toBe(testAdminId);
			}
		});

		it("should handle multiple audiences", async () => {
			const ctx = {
				drizzleClient: server.drizzleClient,
				currentClient: { isAuthenticated: true, user: { id: testMemberId } }, // Use existing user
				log: server.log,
			} as unknown as GraphQLContext;
			const engine = new NotificationEngine(ctx);

			await engine.createNotification(
				"test_event",
				{ name: "Multiple Targets" },
				[
					{
						targetType: NotificationTargetType.USER,
						targetIds: [testUserId],
					},
					{
						targetType: NotificationTargetType.ADMIN,
						targetIds: [],
					},
				],
			);

			const logs =
				await server.drizzleClient.query.notificationLogsTable.findMany();
			expect(logs).toHaveLength(1);

			const audiences =
				await server.drizzleClient.query.notificationAudienceTable.findMany();
			expect(audiences).toHaveLength(2);

			const audienceUserIds = audiences.map((a) => a.userId).sort();
			expect(audienceUserIds).toEqual([testAdminId, testUserId].sort());
		});

		it("should use correct channel type", async () => {
			const ctx = {
				drizzleClient: server.drizzleClient,
				currentClient: { isAuthenticated: false, user: { id: testUserId } }, // Use existing user
				log: server.log,
			} as unknown as GraphQLContext;
			const engine = new NotificationEngine(ctx);

			await engine.createNotification(
				"test_event",
				{ name: "Email Test", subject: "Test Subject" },
				{
					targetType: NotificationTargetType.USER,
					targetIds: [testUserId],
				},
				NotificationChannelType.EMAIL,
			);

			const logs =
				await server.drizzleClient.query.notificationLogsTable.findMany();
			expect(logs).toHaveLength(1);

			const logEntry = logs[0];
			expect(logEntry).toBeDefined();
			if (logEntry) {
				expect(logEntry.channel).toBe(NotificationChannelType.EMAIL);

				const renderedContent = logEntry.renderedContent as {
					title: string;
					body: string;
				};
				expect(renderedContent.title).toBe("Email: Test Subject");
			}
		});

		it("should handle unauthenticated user (no sender)", async () => {
			const ctx = {
				drizzleClient: server.drizzleClient,
				currentClient: { isAuthenticated: false, user: { id: "anonymous" } },
				log: server.log,
			} as unknown as GraphQLContext;
			const engine = new NotificationEngine(ctx);

			await engine.createNotification(
				"test_event",
				{ name: "Anonymous" },
				{
					targetType: NotificationTargetType.USER,
					targetIds: [testUserId],
				},
			);

			const logs =
				await server.drizzleClient.query.notificationLogsTable.findMany();
			expect(logs).toHaveLength(1);

			const logEntry = logs[0];
			expect(logEntry).toBeDefined();
			if (logEntry) {
				expect(logEntry.sender).toBeNull();
			}

			const audiences =
				await server.drizzleClient.query.notificationAudienceTable.findMany();
			expect(audiences).toHaveLength(1);

			const audEntry = audiences[0];
			expect(audEntry).toBeDefined();
			if (audEntry) {
				expect(audEntry.userId).toBe(testUserId);
			}
		});

		it("should throw error when template not found", async () => {
			const ctx = {
				drizzleClient: server.drizzleClient,
				currentClient: { isAuthenticated: true, user: { id: testUserId } },
				log: server.log,
			} as unknown as GraphQLContext;
			const engine = new NotificationEngine(ctx);

			await expect(
				engine.createNotification(
					"nonexistent_event",
					{ name: "Test" },
					{
						targetType: NotificationTargetType.USER,
						targetIds: [testUserId],
					},
				),
			).rejects.toThrow(
				'No notification template found for event type "nonexistent_event" and channel "in_app"',
			);
		});

		it("should handle empty target IDs gracefully", async () => {
			const ctx = {
				drizzleClient: server.drizzleClient,
				currentClient: { isAuthenticated: true, user: { id: testUserId } },
				log: server.log,
			} as unknown as GraphQLContext;
			const engine = new NotificationEngine(ctx);

			await engine.createNotification(
				"test_event",
				{ name: "Empty Targets" },
				{
					targetType: NotificationTargetType.USER,
					targetIds: [],
				},
			);

			const logs =
				await server.drizzleClient.query.notificationLogsTable.findMany();
			expect(logs).toHaveLength(1);

			const audiences =
				await server.drizzleClient.query.notificationAudienceTable.findMany();
			expect(audiences).toHaveLength(0);
		});

		it("should handle template rendering with missing variables", async () => {
			const ctx = {
				drizzleClient: server.drizzleClient,
				currentClient: { isAuthenticated: true, user: { id: testUserId } },
				log: server.log,
			} as unknown as GraphQLContext;
			const engine = new NotificationEngine(ctx);

			await engine.createNotification(
				"test_event",
				{ name: "Alice" },
				{
					targetType: NotificationTargetType.USER,
					targetIds: [testUserId],
				},
			);

			const logs =
				await server.drizzleClient.query.notificationLogsTable.findMany();
			expect(logs).toHaveLength(1);

			const logEntry = logs[0];
			expect(logEntry).toBeDefined();
			if (logEntry) {
				const renderedContent = logEntry.renderedContent as {
					title: string;
					body: string;
				};
				expect(renderedContent.title).toBe("Hello Alice");
				expect(renderedContent.body).toBe(
					"Welcome to {organizationName}, Alice! Your ID is {userId}.",
				);
			}
		});

		it("should handle null and undefined variables", async () => {
			const ctx = {
				drizzleClient: server.drizzleClient,
				currentClient: { isAuthenticated: true, user: { id: testUserId } },
				log: server.log,
			} as unknown as GraphQLContext;
			const engine = new NotificationEngine(ctx);

			await engine.createNotification(
				"test_event",
				{
					name: "Alice",
					organizationName: null,
					userId: undefined,
				},
				{
					targetType: NotificationTargetType.USER,
					targetIds: [testUserId],
				},
			);

			const notificationLogs =
				await server.drizzleClient.query.notificationLogsTable.findMany();
			expect(notificationLogs).toHaveLength(1);

			const logEntry = notificationLogs[0];
			expect(logEntry).toBeDefined();
			if (logEntry) {
				const renderedContent = logEntry.renderedContent as {
					title: string;
					body: string;
				};
				expect(renderedContent.title).toBe("Hello Alice");
				expect(renderedContent.body).toBe(
					"Welcome to {organizationName}, Alice! Your ID is {userId}.",
				);
			}
		});
	});

	describe("renderTemplate", () => {
		it("should render template with all variables", async () => {
			const ctx = {
				drizzleClient: server.drizzleClient,
				currentClient: { isAuthenticated: true, user: { id: testUserId } },
				log: server.log,
			} as unknown as GraphQLContext;
			const engine = new NotificationEngine(ctx);

			await engine.createNotification(
				"test_event",
				{
					name: "John Doe",
					organizationName: "Acme Corp",
					userId: "user-123",
				},
				{
					targetType: NotificationTargetType.USER,
					targetIds: [testUserId],
				},
			);

			const logs =
				await server.drizzleClient.query.notificationLogsTable.findMany();
			const renderedContent = logs[0]?.renderedContent as {
				title: string;
				body: string;
			};

			expect(renderedContent.title).toBe("Hello John Doe");
			expect(renderedContent.body).toBe(
				"Welcome to Acme Corp, John Doe! Your ID is user-123.",
			);
		});
	});
});
