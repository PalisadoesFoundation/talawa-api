import { faker } from "@faker-js/faker";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeAll, expect, suite, test } from "vitest";
import { notificationTemplatesTable } from "~/src/drizzle/tables/NotificationTemplate";
import type { GraphQLContext } from "~/src/graphql/context";
import { notificationEventBus } from "~/src/graphql/types/Notification/EventBus/eventBus";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Mutation_readNotification,
	Query_signIn,
	Query_user_notifications,
} from "../documentNodes";

// Admin auth (fresh token fetched per invocation — no shared state)
async function ensureAdminAuth(): Promise<{ token: string; userId: string }> {
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
	const token = res.data.signIn.authenticationToken;
	const userId = res.data.signIn.user.id;
	assertToBeNonNullish(token);
	assertToBeNonNullish(userId);
	return { token, userId };
}

// Helper Types
interface TestUser {
	userId: string;
	authToken: string;
	organizationId: string;
	cleanup: () => Promise<void>;
}

interface GraphQLNotification {
	id: string | null;
	isRead: boolean | null;
	readAt: string | null;
}

async function createTestUser(): Promise<TestUser> {
	const regularUser = await createRegularUserUsingAdmin();
	const { token: adminToken } = await ensureAdminAuth();

	// making orgId for my test instead or querying
	const orgResult = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${adminToken}` },
		variables: {
			input: {
				name: `Test Org ${faker.string.uuid()}`,
				countryCode: "us",
			},
		},
	});

	if (orgResult.errors) {
		throw new Error(
			`Failed to create test org: ${JSON.stringify(orgResult.errors)}`,
		);
	}

	const organizationId = orgResult.data?.createOrganization?.id;
	if (!organizationId) {
		throw new Error("Failed to create test organization");
	}

	const membershipResult = await mercuriusClient.mutate(
		Mutation_createOrganizationMembership,
		{
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					organizationId,
					memberId: regularUser.userId,
					role: "regular",
				},
			},
		},
	);

	if (membershipResult.errors) {
		throw new Error(
			`Failed to create test org membership: ${JSON.stringify(membershipResult.errors)}`,
		);
	}

	return {
		userId: regularUser.userId,
		authToken: regularUser.authToken,
		organizationId,
		cleanup: async () => {
			const { token } = await ensureAdminAuth();
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${token}` },
				variables: { input: { id: regularUser.userId } },
			});

			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${token}` },
				variables: { input: { id: organizationId } },
			});
		},
	};
}

async function createNotificationViaEventBus(
	_userId: string,
	organizationId: string,
): Promise<void> {
	await notificationEventBus.emitPostCreated(
		{
			postId: faker.string.uuid(),
			organizationId,
			authorName: faker.person.fullName(),
			organizationName: faker.company.name(),
			postCaption: faker.lorem.sentence(),
		},
		{
			log: {
				info: () => {},
				warn: () => {},
				error: () => {},
			},
			drizzleClient: server.drizzleClient,
			currentClient: {
				isAuthenticated: false,
				user: undefined,
			},
		} as unknown as GraphQLContext,
	);
}

/**
 * Determining test timeout based on environment.
 * In CI environments, using a higher timeout (30s) to account for slower infra.
 * Locally, using 10s for faster feedback.
 * Can be overridden via LONG_TEST_TIMEOUT env variable.
 */
const LONG_TEST_TIMEOUT = parseInt(
	process.env.LONG_TEST_TIMEOUT || (process.env.CI ? "30000" : "10000"),
	10,
);

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
			// Do NOT push testUser.cleanup here — the user is deleted manually below,
			// so we only register org cleanup to avoid a double-delete on the user.
			testCleanupFunctions.push(async () => {
				const { token } = await ensureAdminAuth();
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${token}` },
					variables: { input: { id: testUser.organizationId } },
				});
			});
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

				/**
				 * Create a notification via the EventBus (synchronous).
				 */
				await createNotificationViaEventBus(
					testUser.userId,
					testUser.organizationId,
				);

				const notificationResult = await mercuriusClient.query(
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

				expect(notificationResult.errors).toBeUndefined();
				expect(notificationResult.data).toBeDefined();
				assertToBeNonNullish(notificationResult.data);
				const notifications = notificationResult.data.user?.notifications || [];

				expect(notifications.length).toBeGreaterThan(0);

				const firstNotification = notifications[0];
				expect(firstNotification).toBeDefined();
				assertToBeNonNullish(firstNotification);
				expect(firstNotification.isRead).toBe(false);
				expect(firstNotification.readAt).toBeNull();

				assertToBeNonNullish(firstNotification.id);

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
				console.log(
					"updatedNotificationsResult:",
					JSON.stringify(updatedNotificationsResult, null, 2),
				);
				console.log("firstNotification.id:", firstNotification.id);
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

				// Create 2 notifications via EventBus (synchronous)
				await createNotificationViaEventBus(
					testUser.userId,
					testUser.organizationId,
				);
				await createNotificationViaEventBus(
					testUser.userId,
					testUser.organizationId,
				);

				const notificationsResult = await mercuriusClient.query(
					Query_user_notifications,
					{
						headers: { authorization: `bearer ${testUser.authToken}` },
						variables: {
							input: { id: testUser.userId },
							notificationInput: { first: 20 },
						},
					},
				);
				const notifications =
					notificationsResult.data?.user?.notifications || [];
				expect(notifications.length).toBeGreaterThanOrEqual(2);

				const unreadNotifications = notifications.filter(
					(
						n: GraphQLNotification | null | undefined,
					): n is GraphQLNotification => n != null && !n.isRead && n.id != null,
				);
				expect(unreadNotifications.length).toBeGreaterThanOrEqual(2);

				const notificationIds = unreadNotifications.slice(0, 2).map((n) => {
					assertToBeNonNullish(n.id);
					return n.id;
				});
				expect(notificationIds.length).toBe(2);

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

				// Create notifications via EventBus (synchronous)
				await createNotificationViaEventBus(
					testUser1.userId,
					testUser1.organizationId,
				);
				await createNotificationViaEventBus(
					testUser2.userId,
					testUser2.organizationId,
				);

				const user1NotificationsResult = await mercuriusClient.query(
					Query_user_notifications,
					{
						headers: { authorization: `bearer ${testUser1.authToken}` },
						variables: {
							input: { id: testUser1.userId },
							notificationInput: { first: 20 },
						},
					},
				);
				const user1Notifications =
					user1NotificationsResult.data?.user?.notifications || [];

				const user2NotificationsResult = await mercuriusClient.query(
					Query_user_notifications,
					{
						headers: { authorization: `bearer ${testUser2.authToken}` },
						variables: {
							input: { id: testUser2.userId },
							notificationInput: { first: 20 },
						},
					},
				);
				const user2Notifications =
					user2NotificationsResult.data?.user?.notifications || [];

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

				// Create notification via EventBus (synchronous)
				await createNotificationViaEventBus(
					testUser.userId,
					testUser.organizationId,
				);

				const notificationsResult = await mercuriusClient.query(
					Query_user_notifications,
					{
						headers: { authorization: `bearer ${testUser.authToken}` },
						variables: {
							input: { id: testUser.userId },
							notificationInput: { first: 20 },
						},
					},
				);
				const notifications =
					notificationsResult.data?.user?.notifications || [];
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
