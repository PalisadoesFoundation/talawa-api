import { faker } from "@faker-js/faker";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeAll, expect, suite, test } from "vitest";
import { notificationAudienceTable } from "~/src/drizzle/tables/NotificationAudience";
import { notificationLogsTable } from "~/src/drizzle/tables/NotificationLog";
import { notificationTemplatesTable } from "~/src/drizzle/tables/NotificationTemplate";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_deleteUser,
	Mutation_readNotification,
	Query_signIn,
	Query_user_notifications,
} from "../documentNodes";

// Admin auth (fetched once per suite)
let adminToken: string | null = null;
let adminUserId: string | null = null;
async function ensureAdminAuth(): Promise<{ token: string; userId: string }> {
	if (adminToken && adminUserId)
		return { token: adminToken, userId: adminUserId };
	if (
		!server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS ||
		!server.envConfig.API_ADMINISTRATOR_USER_PASSWORD
	) {
		throw new Error("Admin credentials missing in env config");
	}
	const res = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});
	if (
		res.errors ||
		!res.data?.signIn?.authenticationToken ||
		!res.data?.signIn?.user?.id
	) {
		throw new Error(
			`Unable to sign in admin: ${res.errors?.[0]?.message || "unknown"}`,
		);
	}
	adminToken = res.data.signIn.authenticationToken;
	adminUserId = res.data.signIn.user.id;
	assertToBeNonNullish(adminToken);
	assertToBeNonNullish(adminUserId);
	return { token: adminToken, userId: adminUserId };
}

// Helper Types
interface TestUser {
	userId: string;
	authToken: string;
	cleanup: () => Promise<void>;
}

interface GraphQLNotification {
	id: string | null;
	isRead: boolean | null;
	readAt: string | null;
}

type NotificationItem = {
	id: string;
	isRead: boolean;
	readAt: string | null;
};

async function createTestUser(): Promise<TestUser> {
	const regularUser = await createRegularUserUsingAdmin();
	return {
		userId: regularUser.userId,
		authToken: regularUser.authToken,
		cleanup: async () => {
			const { token } = await ensureAdminAuth();
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${token}` },
				variables: { input: { id: regularUser.userId } },
			});
		},
	};
}

async function waitForNotifications(
	userId: string,
	authToken: string,
	timeoutMs = 5000,
	minCount = 1,
): Promise<NotificationItem[]> {
	const startTime = Date.now();
	while (Date.now() - startTime < timeoutMs) {
		const notificationsResult = await mercuriusClient.query(
			Query_user_notifications,
			{
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: { id: userId },
					notificationInput: { first: 20 },
				},
			},
		);

		const raw = notificationsResult.data?.user?.notifications ?? [];

		const items: NotificationItem[] = raw.flatMap(
			(n: GraphQLNotification | null | undefined) => {
				const id = n?.id ?? null;
				const isRead = n?.isRead ?? null;
				const readAt = n?.readAt ?? null;
				return id && typeof isRead === "boolean"
					? [{ id, isRead, readAt }]
					: [];
			},
		);

		if (items.length >= minCount) return items;

		await new Promise((resolve) => setTimeout(resolve, 100));
	}
	return [];
}

/**
 * Directly insert a notification into the DB, bypassing the async EventBus.
 * The EventBus uses setImmediate which is unreliable under CI load.
 * This makes tests deterministic while still testing readNotification.
 */
async function createDirectNotification(userId: string): Promise<string> {
	const [template] = await server.drizzleClient
		.select()
		.from(notificationTemplatesTable)
		.where(
			and(
				eq(notificationTemplatesTable.eventType, "post_created"),
				eq(notificationTemplatesTable.channelType, "in_app"),
			),
		)
		.limit(1);

	assertToBeNonNullish(template);

	const [notificationLog] = await server.drizzleClient
		.insert(notificationLogsTable)
		.values({
			templateId: template.id,
			eventType: "post_created",
			channel: "in_app",
			status: "sent",
			renderedContent: {
				title: "Test notification",
				body: "Test notification body",
			},
		})
		.returning();

	assertToBeNonNullish(notificationLog);

	await server.drizzleClient.insert(notificationAudienceTable).values({
		notificationId: notificationLog.id,
		userId,
		isRead: false,
	});

	return notificationLog.id;
}

const LONG_TEST_TIMEOUT = 30000;
beforeAll(async () => {
	await ensureAdminAuth();
	// Ensure notification templates exist (API-level create via drizzle is allowed here because template table lacks exposed mutation; retain one-time setup)

	// Seed post_created template (used by this test suite)
	const [existingPost] = await server.drizzleClient
		.select()
		.from(notificationTemplatesTable)
		.where(
			and(
				eq(notificationTemplatesTable.eventType, "post_created"),
				eq(notificationTemplatesTable.channelType, "in_app"),
			),
		)
		.limit(1);
	if (!existingPost) {
		await server.drizzleClient.insert(notificationTemplatesTable).values({
			name: "New Post Created",
			eventType: "post_created",
			title: "New post by {authorName}",
			body: '{authorName} has created a new post in {organizationName}: "{postCaption}"',
			channelType: "in_app",
			linkedRouteName: "/post/{postId}",
		});
	}

	// Seed event_created template to prevent "No notification template found"
	// errors from other tests in the same shard that create events, which can
	// block or slow down the shared notification queue.
	const [existingEvent] = await server.drizzleClient
		.select()
		.from(notificationTemplatesTable)
		.where(
			and(
				eq(notificationTemplatesTable.eventType, "event_created"),
				eq(notificationTemplatesTable.channelType, "in_app"),
			),
		)
		.limit(1);
	if (!existingEvent) {
		await server.drizzleClient.insert(notificationTemplatesTable).values({
			name: "New Event Created",
			eventType: "event_created",
			title: "New event: {eventName}",
			body: '{creatorName} created "{eventName}" in {organizationName}',
			channelType: "in_app",
			linkedRouteName: "/event/{eventId}",
		});
	}
});

suite("Mutation readNotification", () => {
	suite("Authentication", () => {
		const testCleanupFunctions: Array<() => Promise<void>> = [];

		afterEach(async () => {
			for (const cleanup of testCleanupFunctions.reverse()) {
				try {
					await cleanup();
				} catch (error) {
					console.error("Cleanup failed:", error);
				}
			}
			testCleanupFunctions.length = 0;
		});

		test("Returns an error when the user is unauthenticated", async () => {
			const readNotificationResult = await mercuriusClient.mutate(
				Mutation_readNotification,
				{
					variables: {
						input: {
							notificationIds: [faker.string.uuid()],
						},
					},
				},
			);

			expect(readNotificationResult.errors).toBeDefined();
			expect(readNotificationResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["readNotification"],
					}),
				]),
			);
		});

		test("Returns an error when the user is present in token but deleted (simulated)", async () => {
			const testUser = await createTestUser();
			testCleanupFunctions.push(testUser.cleanup);
			// Delete the user via API
			const { token } = await ensureAdminAuth();
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${token}` },
				variables: { input: { id: testUser.userId } },
			});
			const result = await mercuriusClient.mutate(Mutation_readNotification, {
				headers: { authorization: `bearer ${testUser.authToken}` },
				variables: { input: { notificationIds: [faker.string.uuid()] } },
			});
			expect(result.errors).toBeDefined();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
					}),
				]),
			);
		});
	});

	suite("Input Validation", () => {
		const testCleanupFunctions: Array<() => Promise<void>> = [];

		afterEach(async () => {
			for (const cleanup of testCleanupFunctions.reverse()) {
				try {
					await cleanup();
				} catch (error) {
					console.error("Cleanup failed:", error);
				}
			}
			testCleanupFunctions.length = 0;
		});

		test("Returns an error when notificationIds is not a valid UUID", async () => {
			const testUser = await createTestUser();
			testCleanupFunctions.push(testUser.cleanup);

			const readNotificationResult = await mercuriusClient.mutate(
				Mutation_readNotification,
				{
					headers: {
						authorization: `bearer ${testUser.authToken}`,
					},
					variables: {
						input: {
							notificationIds: ["invalid-uuid"],
						},
					},
				},
			);

			expect(readNotificationResult.errors).toBeDefined();
			expect(readNotificationResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining([
										"input",
										"notificationIds",
									]),
								}),
							]),
						}),
						message: expect.any(String),
					}),
				]),
			);
		});

		test("Returns an error when notificationIds array is empty", async () => {
			const testUser = await createTestUser();
			testCleanupFunctions.push(testUser.cleanup);

			const readNotificationResult = await mercuriusClient.mutate(
				Mutation_readNotification,
				{
					headers: {
						authorization: `bearer ${testUser.authToken}`,
					},
					variables: {
						input: {
							notificationIds: [],
						},
					},
				},
			);

			expect(readNotificationResult.errors).toBeDefined();
			expect(readNotificationResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining([
										"input",
										"notificationIds",
									]),
								}),
							]),
						}),
						message: expect.any(String),
					}),
				]),
			);
		});
	});

	suite("Business Logic", () => {
		const testCleanupFunctions: Array<() => Promise<void>> = [];

		afterEach(async () => {
			for (const cleanup of testCleanupFunctions.reverse()) {
				try {
					await cleanup();
				} catch (error) {
					console.error("Cleanup failed:", error);
				}
			}
			// Reset the cleanup functions array
			testCleanupFunctions.length = 0;
		});

		test(
			"Successfully marks single notification as read when notification exists",
			async () => {
				const testUser = await createTestUser();
				testCleanupFunctions.push(testUser.cleanup);

				// Directly insert notification via DB (bypasses flaky async EventBus)
				await createDirectNotification(testUser.userId);

				const notifications = await waitForNotifications(
					testUser.userId,
					testUser.authToken,
				);
				expect(notifications.length).toBeGreaterThan(0);

				const firstNotification = notifications[0];
				expect(firstNotification).toBeDefined();
				assertToBeNonNullish(firstNotification);
				expect(firstNotification.isRead).toBe(false);
				expect(firstNotification.readAt).toBeNull();

				const readNotificationResult = await mercuriusClient.mutate(
					Mutation_readNotification,
					{
						headers: {
							authorization: `bearer ${testUser.authToken}`,
						},
						variables: {
							input: {
								notificationIds: [firstNotification.id],
							},
						},
					},
				);

				expect(readNotificationResult.errors).toBeUndefined();
				expect(readNotificationResult.data).toBeDefined();
				assertToBeNonNullish(readNotificationResult.data);
				assertToBeNonNullish(readNotificationResult.data.readNotification);
				expect(readNotificationResult.data.readNotification.success).toBe(true);
				expect(readNotificationResult.data.readNotification.message).toContain(
					"Marked 1 notification(s) as read",
				);

				const updatedNotificationsResult = await mercuriusClient.query(
					Query_user_notifications,
					{
						headers: {
							authorization: `bearer ${testUser.authToken}`,
						},
						variables: {
							input: { id: testUser.userId },
							notificationInput: { first: 20 },
						},
					},
				);

				expect(updatedNotificationsResult.errors).toBeUndefined();
				expect(updatedNotificationsResult.data).toBeDefined();
				assertToBeNonNullish(updatedNotificationsResult.data);
				const updatedNotification =
					updatedNotificationsResult.data.user?.notifications?.find(
						(n: GraphQLNotification | null | undefined) =>
							n?.id === firstNotification.id,
					);
				expect(updatedNotification).toBeDefined();
				assertToBeNonNullish(updatedNotification);
				expect(updatedNotification.isRead).toBe(true);
				expect(updatedNotification.readAt).not.toBeNull();
			},
			LONG_TEST_TIMEOUT,
		);

		test(
			"Successfully marks multiple notifications as read when notifications exist",
			async () => {
				const testUser = await createTestUser();
				testCleanupFunctions.push(testUser.cleanup);

				// Directly insert 2 notifications via DB (bypasses flaky async EventBus)
				await createDirectNotification(testUser.userId);
				await createDirectNotification(testUser.userId);

				const notifications = await waitForNotifications(
					testUser.userId,
					testUser.authToken,
					15000,
					2,
				);
				expect(notifications.length).toBeGreaterThanOrEqual(2);

				const unreadNotifications = notifications.filter((n) => !n.isRead);
				expect(unreadNotifications.length).toBeGreaterThanOrEqual(2);

				const notificationIds = unreadNotifications
					.slice(0, 2)
					.map((n) => n.id);

				const readNotificationResult = await mercuriusClient.mutate(
					Mutation_readNotification,
					{
						headers: {
							authorization: `bearer ${testUser.authToken}`,
						},
						variables: {
							input: {
								notificationIds,
							},
						},
					},
				);

				expect(readNotificationResult.errors).toBeUndefined();
				expect(readNotificationResult.data).toBeDefined();
				assertToBeNonNullish(readNotificationResult.data);
				assertToBeNonNullish(readNotificationResult.data.readNotification);
				expect(readNotificationResult.data.readNotification.success).toBe(true);
				expect(readNotificationResult.data.readNotification.message).toContain(
					"Marked 2 notification(s) as read",
				);

				const updatedNotificationsResult = await mercuriusClient.query(
					Query_user_notifications,
					{
						headers: {
							authorization: `bearer ${testUser.authToken}`,
						},
						variables: {
							input: { id: testUser.userId },
							notificationInput: { first: 20 },
						},
					},
				);

				expect(updatedNotificationsResult.errors).toBeUndefined();
				expect(updatedNotificationsResult.data).toBeDefined();
				assertToBeNonNullish(updatedNotificationsResult.data);

				for (const notificationId of notificationIds) {
					const updatedNotification =
						updatedNotificationsResult.data.user?.notifications?.find(
							(n: GraphQLNotification | null | undefined) =>
								n?.id === notificationId,
						);
					expect(updatedNotification).toBeDefined();
					assertToBeNonNullish(updatedNotification);
					expect(updatedNotification.isRead).toBe(true);
					expect(updatedNotification.readAt).not.toBeNull();
				}
			},
			LONG_TEST_TIMEOUT,
		);

		test("Returns success even when notification does not exist", async () => {
			const testUser = await createTestUser();
			testCleanupFunctions.push(testUser.cleanup);

			const nonExistentNotificationId = faker.string.uuid();

			const readNotificationResult = await mercuriusClient.mutate(
				Mutation_readNotification,
				{
					headers: {
						authorization: `bearer ${testUser.authToken}`,
					},
					variables: {
						input: {
							notificationIds: [nonExistentNotificationId],
						},
					},
				},
			);

			expect(readNotificationResult.errors).toBeUndefined();
			expect(readNotificationResult.data).toBeDefined();
			assertToBeNonNullish(readNotificationResult.data);
			assertToBeNonNullish(readNotificationResult.data.readNotification);
			expect(readNotificationResult.data.readNotification.success).toBe(true);
			expect(readNotificationResult.data.readNotification.message).toContain(
				"Marked 1 notification(s) as read",
			);
		});

		test(
			"Only marks notifications belonging to the current user as read",
			async () => {
				const testUser1 = await createTestUser();
				testCleanupFunctions.push(testUser1.cleanup);

				const testUser2 = await createTestUser();
				testCleanupFunctions.push(testUser2.cleanup);

				// Directly insert notifications for each user (bypasses flaky async EventBus)
				await createDirectNotification(testUser1.userId);
				await createDirectNotification(testUser2.userId);

				const user1Notifications = await waitForNotifications(
					testUser1.userId,
					testUser1.authToken,
				);
				const user2Notifications = await waitForNotifications(
					testUser2.userId,
					testUser2.authToken,
				);

				expect(user1Notifications.length).toBeGreaterThan(0);
				expect(user2Notifications.length).toBeGreaterThan(0);

				const user2NotificationId = user2Notifications[0]?.id;
				expect(user2NotificationId).toBeDefined();
				assertToBeNonNullish(user2NotificationId);

				const readNotificationResult = await mercuriusClient.mutate(
					Mutation_readNotification,
					{
						headers: {
							authorization: `bearer ${testUser1.authToken}`,
						},
						variables: {
							input: {
								notificationIds: [user2NotificationId],
							},
						},
					},
				);

				expect(readNotificationResult.errors).toBeUndefined();
				expect(readNotificationResult.data).toBeDefined();
				assertToBeNonNullish(readNotificationResult.data);
				assertToBeNonNullish(readNotificationResult.data.readNotification);
				expect(readNotificationResult.data.readNotification.success).toBe(true);

				const user2UpdatedNotificationsResult = await mercuriusClient.query(
					Query_user_notifications,
					{
						headers: {
							authorization: `bearer ${testUser2.authToken}`,
						},
						variables: {
							input: { id: testUser2.userId },
							notificationInput: { first: 20 },
						},
					},
				);

				expect(user2UpdatedNotificationsResult.errors).toBeUndefined();
				expect(user2UpdatedNotificationsResult.data).toBeDefined();
				assertToBeNonNullish(user2UpdatedNotificationsResult.data);

				const user2UpdatedNotification =
					user2UpdatedNotificationsResult.data.user?.notifications?.find(
						(n: GraphQLNotification | null | undefined) =>
							n?.id === user2NotificationId,
					);
				expect(user2UpdatedNotification).toBeDefined();
				assertToBeNonNullish(user2UpdatedNotification);
				expect(user2UpdatedNotification.isRead).toBe(false);
				expect(user2UpdatedNotification.readAt).toBeNull();
			},
			LONG_TEST_TIMEOUT,
		);

		test(
			"Handles mixed valid and invalid notification IDs gracefully",
			async () => {
				const testUser = await createTestUser();
				testCleanupFunctions.push(testUser.cleanup);

				// Directly insert notification via DB (bypasses flaky async EventBus)
				await createDirectNotification(testUser.userId);

				const notifications = await waitForNotifications(
					testUser.userId,
					testUser.authToken,
				);
				expect(notifications.length).toBeGreaterThan(0);

				const validNotificationId = notifications[0]?.id;
				expect(validNotificationId).toBeDefined();
				assertToBeNonNullish(validNotificationId);
				const invalidNotificationId = faker.string.uuid();

				const readNotificationResult = await mercuriusClient.mutate(
					Mutation_readNotification,
					{
						headers: {
							authorization: `bearer ${testUser.authToken}`,
						},
						variables: {
							input: {
								notificationIds: [validNotificationId, invalidNotificationId],
							},
						},
					},
				);

				expect(readNotificationResult.errors).toBeUndefined();
				expect(readNotificationResult.data).toBeDefined();
				assertToBeNonNullish(readNotificationResult.data);
				assertToBeNonNullish(readNotificationResult.data.readNotification);
				expect(readNotificationResult.data.readNotification.success).toBe(true);
				expect(readNotificationResult.data.readNotification.message).toContain(
					"Marked 2 notification(s) as read",
				);

				const updatedNotificationsResult = await mercuriusClient.query(
					Query_user_notifications,
					{
						headers: {
							authorization: `bearer ${testUser.authToken}`,
						},
						variables: {
							input: { id: testUser.userId },
							notificationInput: { first: 20 },
						},
					},
				);

				expect(updatedNotificationsResult.errors).toBeUndefined();
				expect(updatedNotificationsResult.data).toBeDefined();
				assertToBeNonNullish(updatedNotificationsResult.data);

				const updatedNotification =
					updatedNotificationsResult.data.user?.notifications?.find(
						(n: GraphQLNotification | null | undefined) =>
							n?.id === validNotificationId,
					);
				expect(updatedNotification).toBeDefined();
				assertToBeNonNullish(updatedNotification);
				expect(updatedNotification.isRead).toBe(true);
				expect(updatedNotification.readAt).not.toBeNull();
			},
			LONG_TEST_TIMEOUT,
		);
	});
});
