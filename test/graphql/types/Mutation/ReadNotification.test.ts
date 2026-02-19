import { faker } from "@faker-js/faker";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeAll, expect, suite, test } from "vitest";
import { notificationTemplatesTable } from "~/src/drizzle/tables/NotificationTemplate";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createPost,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Mutation_readNotification,
	Query_currentUser,
	Query_user_notifications,
} from "../documentNodes";

let adminToken: string | null = null;
let adminUserId: string | null = null;
async function ensureAdminAuth(): Promise<{ token: string; userId: string }> {
	if (adminToken && adminUserId)
		return { token: adminToken, userId: adminUserId };
	const { accessToken } = await getAdminAuthViaRest(server);
	adminToken = accessToken;
	assertToBeNonNullish(adminToken);
	const currentUserResult = await mercuriusClient.query(Query_currentUser, {
		headers: { authorization: `bearer ${adminToken}` },
	});
	adminUserId = currentUserResult.data?.currentUser?.id ?? null;
	assertToBeNonNullish(adminUserId);
	return { token: adminToken, userId: adminUserId };
}

// Helper Types
interface TestOrganization {
	orgId: string;
	cleanup: () => Promise<void>;
}

interface TestPost {
	postId: string;
	cleanup: () => Promise<void>;
}

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

async function createTestOrganization(): Promise<TestOrganization> {
	const { token } = await ensureAdminAuth();
	const res = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${token}` },
		variables: {
			input: { name: `Org ${faker.string.uuid()}`, countryCode: "us" },
		},
	});
	if (!res.data?.createOrganization?.id)
		throw new Error(res.errors?.[0]?.message || "org create failed");
	const orgId = res.data.createOrganization.id;
	return {
		orgId,
		cleanup: async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${token}` },
				variables: { input: { id: orgId } },
			});
		},
	};
}

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

async function createTestPost(
	organizationId: string,
	authToken: string,
): Promise<TestPost> {
	const res = await mercuriusClient.mutate(Mutation_createPost, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				organizationId,
				caption: `Test post ${faker.lorem.words(3)}`,
			},
		},
	});
	if (!res.data?.createPost?.id)
		throw new Error(res.errors?.[0]?.message || "post create failed");
	return {
		postId: res.data.createPost.id,
		cleanup: async () => {
			/* no delete needed currently */
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

const LONG_TEST_TIMEOUT = 20000;
beforeAll(async () => {
	await ensureAdminAuth();
	// Ensure notification template exists (API-level create via drizzle is allowed here because template table lacks exposed mutation; retain one-time setup)
	const [existing] = await server.drizzleClient
		.select()
		.from(notificationTemplatesTable)
		.where(
			and(
				eq(notificationTemplatesTable.eventType, "post_created"),
				eq(notificationTemplatesTable.channelType, "in_app"),
			),
		)
		.limit(1);
	if (!existing) {
		await server.drizzleClient.insert(notificationTemplatesTable).values({
			name: "New Post Created",
			eventType: "post_created",
			title: "New post by {authorName}",
			body: '{authorName} has created a new post in {organizationName}: "{postCaption}"',
			channelType: "in_app",
			linkedRouteName: "/post/{postId}",
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
				const organization = await createTestOrganization();
				testCleanupFunctions.push(organization.cleanup);

				const testUser = await createTestUser();
				testCleanupFunctions.push(testUser.cleanup);

				const { token: adminAuth } = await ensureAdminAuth();
				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${adminAuth}` },
					variables: {
						input: {
							memberId: testUser.userId,
							organizationId: organization.orgId,
							role: "regular",
						},
					},
				});

				const { token: adminAuthToken } = await ensureAdminAuth();
				const post = await createTestPost(organization.orgId, adminAuthToken);
				testCleanupFunctions.push(post.cleanup);

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
				const organization = await createTestOrganization();
				testCleanupFunctions.push(organization.cleanup);

				const testUser = await createTestUser();
				testCleanupFunctions.push(testUser.cleanup);

				const { token: adminAuth } = await ensureAdminAuth();
				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${adminAuth}` },
					variables: {
						input: {
							memberId: testUser.userId,
							organizationId: organization.orgId,
							role: "regular",
						},
					},
				});

				const { token: adminAuthToken } = await ensureAdminAuth();
				const post1 = await createTestPost(organization.orgId, adminAuthToken);
				testCleanupFunctions.push(post1.cleanup);

				const post2 = await createTestPost(organization.orgId, adminAuthToken);
				testCleanupFunctions.push(post2.cleanup);

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
				const organization = await createTestOrganization();
				testCleanupFunctions.push(organization.cleanup);

				const testUser1 = await createTestUser();
				testCleanupFunctions.push(testUser1.cleanup);

				const testUser2 = await createTestUser();
				testCleanupFunctions.push(testUser2.cleanup);

				const { token: adminAuth } = await ensureAdminAuth();
				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${adminAuth}` },
					variables: {
						input: {
							memberId: testUser1.userId,
							organizationId: organization.orgId,
							role: "regular",
						},
					},
				});
				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${adminAuth}` },
					variables: {
						input: {
							memberId: testUser2.userId,
							organizationId: organization.orgId,
							role: "regular",
						},
					},
				});

				const { token: adminAuthToken } = await ensureAdminAuth();
				const post = await createTestPost(organization.orgId, adminAuthToken);
				testCleanupFunctions.push(post.cleanup);

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
				const organization = await createTestOrganization();
				testCleanupFunctions.push(organization.cleanup);

				const testUser = await createTestUser();
				testCleanupFunctions.push(testUser.cleanup);

				const { token: adminAuth } = await ensureAdminAuth();
				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${adminAuth}` },
					variables: {
						input: {
							memberId: testUser.userId,
							organizationId: organization.orgId,
							role: "regular",
						},
					},
				});

				const { token: adminAuthToken } = await ensureAdminAuth();
				const post = await createTestPost(organization.orgId, adminAuthToken);
				testCleanupFunctions.push(post.cleanup);

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
