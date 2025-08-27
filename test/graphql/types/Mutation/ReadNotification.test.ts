import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, expect, suite, test } from "vitest";
import { organizationMembershipsTable, usersTable } from "~/src/drizzle/schema";
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
	Mutation_createOrganization,
	Mutation_createPost,
	Mutation_deleteOrganization,
	Mutation_readNotification,
	Query_signIn,
	Query_user_notifications,
} from "../documentNodes";

/** Helper function to get admin auth token with proper error handling */
let cachedAdminToken: string | null = null;
let cachedAdminId: string | null = null;
async function getAdminAuthTokenAndId(): Promise<{
	cachedAdminToken: string;
	cachedAdminId: string;
}> {
	if (cachedAdminToken && cachedAdminId) {
		return { cachedAdminToken, cachedAdminId };
	}

	try {
		if (
			!server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS ||
			!server.envConfig.API_ADMINISTRATOR_USER_PASSWORD
		) {
			throw new Error(
				"Admin credentials are missing in environment configuration",
			);
		}
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		if (adminSignInResult.errors) {
			throw new Error(
				`Admin authentication failed: ${adminSignInResult.errors[0]?.message || "Unknown error"}`,
			);
		}
		if (!adminSignInResult.data?.signIn?.authenticationToken) {
			throw new Error(
				"Admin authentication succeeded but no token was returned",
			);
		}
		if (!adminSignInResult.data?.signIn?.user?.id) {
			throw new Error(
				"Admin authentication succeeded but no user id was returned",
			);
		}
		cachedAdminToken = adminSignInResult.data.signIn.authenticationToken;
		cachedAdminId = adminSignInResult.data.signIn.user.id;
		return { cachedAdminToken, cachedAdminId };
	} catch (error) {
		throw new Error(
			`Failed to get admin authentication token: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
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

type NotificationItem = {
	id: string;
	isRead: boolean;
	readAt: string | null;
};

async function createTestOrganization(): Promise<TestOrganization> {
	const { cachedAdminToken: adminAuthToken } = await getAdminAuthTokenAndId();

	const createOrgResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					name: `Org ${faker.string.uuid()}`,
					countryCode: "us",
				},
			},
		},
	);

	if (!createOrgResult.data || !createOrgResult.data.createOrganization) {
		throw new Error(
			`Failed to create test organization: ${
				createOrgResult.errors?.[0]?.message || "Unknown error"
			}`,
		);
	}

	assertToBeNonNullish(createOrgResult.data);
	assertToBeNonNullish(createOrgResult.data.createOrganization);
	const orgId = createOrgResult.data.createOrganization.id;

	return {
		orgId,
		cleanup: async () => {
			const errors: Error[] = [];
			try {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			} catch (error) {
				errors.push(error as Error);
				console.error("Failed to delete organization:", error);
			}
			if (errors.length > 0) {
				throw new AggregateError(errors, "One or more cleanup steps failed");
			}
		},
	};
}

async function createTestUser(): Promise<TestUser> {
	const regularUser = await createRegularUserUsingAdmin();
	return {
		userId: regularUser.userId,
		authToken: regularUser.authToken,
		cleanup: async () => {},
	};
}

async function createTestPost(
	organizationId: string,
	authToken: string,
): Promise<TestPost> {
	const createPostResult = await mercuriusClient.mutate(Mutation_createPost, {
		headers: {
			authorization: `bearer ${authToken}`,
		},
		variables: {
			input: {
				organizationId,
				caption: `Test post ${faker.lorem.sentence()}`,
				attachments: [
					{
						mimetype: "IMAGE_PNG",
						objectName: `test-object-${faker.string.uuid()}`,
						name: `test-image-${faker.string.uuid()}.png`,
						fileHash: `test-file-hash-${faker.string.uuid()}`,
					},
				],
			},
		},
	});

	if (!createPostResult.data || !createPostResult.data.createPost) {
		throw new Error(
			`Failed to create test post: ${
				createPostResult.errors?.[0]?.message || "Unknown error"
			}`,
		);
	}

	assertToBeNonNullish(createPostResult.data);
	assertToBeNonNullish(createPostResult.data.createPost);
	const postId = createPostResult.data.createPost.id;

	return {
		postId,
		cleanup: async () => {},
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

		const items: NotificationItem[] = raw.flatMap((n) => {
			const id = n?.id ?? null;
			const isRead = (n?.isRead ?? null) as boolean | null;
			const readAt = (n?.readAt ?? null) as string | null;
			return id && typeof isRead === "boolean" ? [{ id, isRead, readAt }] : [];
		});

		if (items.length >= minCount) return items;

		await new Promise((resolve) => setTimeout(resolve, 100));
	}
	return [];
}

const LONG_TEST_TIMEOUT = 20000;

suite("Mutation readNotification", () => {
	beforeEach(async () => {
		const existing =
			await server.drizzleClient.query.notificationTemplatesTable.findFirst({
				where: (fields, operators) =>
					operators.and(
						operators.eq(fields.eventType, "post_created"),
						operators.eq(fields.channelType, "in_app"),
					),
			});

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

		test("Returns an error when the user is present in the token but not found in the database", async () => {
			const testUser = await createTestUser();
			testCleanupFunctions.push(testUser.cleanup);

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, testUser.userId))
				.execute();

			const readNotificationResult = await mercuriusClient.mutate(
				Mutation_readNotification,
				{
					headers: {
						authorization: `bearer ${testUser.authToken}`,
					},
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

				await server.drizzleClient
					.insert(organizationMembershipsTable)
					.values({
						memberId: testUser.userId,
						organizationId: organization.orgId,
						role: "regular",
					})
					.execute();

				const { cachedAdminToken: adminAuthToken } =
					await getAdminAuthTokenAndId();
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
						(n) => n?.id === firstNotification.id,
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

				await server.drizzleClient
					.insert(organizationMembershipsTable)
					.values({
						memberId: testUser.userId,
						organizationId: organization.orgId,
						role: "regular",
					})
					.execute();

				const { cachedAdminToken: adminAuthToken } =
					await getAdminAuthTokenAndId();
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
							(n) => n?.id === notificationId,
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

				await server.drizzleClient
					.insert(organizationMembershipsTable)
					.values([
						{
							memberId: testUser1.userId,
							organizationId: organization.orgId,
							role: "regular",
						},
						{
							memberId: testUser2.userId,
							organizationId: organization.orgId,
							role: "regular",
						},
					])
					.execute();

				const { cachedAdminToken: adminAuthToken } =
					await getAdminAuthTokenAndId();
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
						(n) => n?.id === user2NotificationId,
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

				await server.drizzleClient
					.insert(organizationMembershipsTable)
					.values({
						memberId: testUser.userId,
						organizationId: organization.orgId,
						role: "regular",
					})
					.execute();

				const { cachedAdminToken: adminAuthToken } =
					await getAdminAuthTokenAndId();
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
						(n) => n?.id === validNotificationId,
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
