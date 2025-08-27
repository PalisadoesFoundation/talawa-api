import { faker } from "@faker-js/faker";
import { inArray } from "drizzle-orm";
import { afterEach, beforeEach, expect, suite, test } from "vitest";
import {
	notificationAudienceTable,
	organizationMembershipsTable,
	postsTable,
	usersTable,
} from "~/src/drizzle/schema";
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
	Mutation_createOrganizationMembership,
	Mutation_createPost,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Query_signIn,
	Query_user_notifications,
} from "../documentNodes";

/** Helper function to get admin auth token with proper error handling */
let cachedAdminToken: string | null = null;
let cachedAdminId: string | null = null;

// Track created artifacts for stronger cleanup (fallback to direct deletion if GraphQL cleanup missed something)
const trackedUserIds = new Set<string>();
const trackedOrganizationIds = new Set<string>();
const trackedPostIds = new Set<string>();

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

async function deepCleanup() {
	const dc = server.drizzleClient;
	const errors: Error[] = [];

	// Posts first
	if (trackedPostIds.size) {
		try {
			await dc
				.delete(postsTable)
				.where(inArray(postsTable.id, [...trackedPostIds]));
		} catch (e) {
			errors.push(e as Error);
		}
	}

	// Memberships referencing tracked orgs/users
	if (trackedOrganizationIds.size || trackedUserIds.size) {
		try {
			if (trackedOrganizationIds.size) {
				await dc
					.delete(organizationMembershipsTable)
					.where(
						inArray(organizationMembershipsTable.organizationId, [
							...trackedOrganizationIds,
						]),
					);
			}
			if (trackedUserIds.size) {
				await dc
					.delete(organizationMembershipsTable)
					.where(
						inArray(organizationMembershipsTable.memberId, [...trackedUserIds]),
					);
			}
		} catch (e) {
			errors.push(e as Error);
		}
	}

	// Notification audience rows for tracked users
	if (trackedUserIds.size) {
		try {
			await dc
				.delete(notificationAudienceTable)
				.where(inArray(notificationAudienceTable.userId, [...trackedUserIds]));
		} catch (e) {
			errors.push(e as Error);
		}
	}

	// Delete organizations via GraphQL (preferred)
	for (const orgId of trackedOrganizationIds) {
		try {
			if (!cachedAdminToken) await getAdminAuthTokenAndId();
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: cachedAdminToken
					? { authorization: `bearer ${cachedAdminToken}` }
					: undefined,
				variables: { input: { id: orgId } },
			});
		} catch (e) {
			errors.push(e as Error);
		}
	}

	// Delete users via GraphQL else direct DB
	for (const userId of trackedUserIds) {
		try {
			if (!cachedAdminToken) await getAdminAuthTokenAndId();
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: cachedAdminToken
					? { authorization: `bearer ${cachedAdminToken}` }
					: undefined,
				variables: { input: { id: userId } },
			});
		} catch (e) {
			try {
				await dc.delete(usersTable).where(inArray(usersTable.id, [userId]));
			} catch (inner) {
				errors.push(inner as Error);
			}
		}
	}

	trackedUserIds.clear();
	trackedOrganizationIds.clear();
	trackedPostIds.clear();

	if (errors.length) {
		// eslint-disable-next-line no-console
		console.error(
			"Deep cleanup encountered issues:",
			errors.map((e) => e.message),
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
	trackedOrganizationIds.add(orgId);

	return {
		orgId,
		cleanup: async () => {
			try {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			} catch {}
			trackedOrganizationIds.delete(orgId);
		},
	};
}

async function createTestUser(): Promise<TestUser> {
	const regularUser = await createRegularUserUsingAdmin();
	trackedUserIds.add(regularUser.userId);
	return {
		userId: regularUser.userId,
		authToken: regularUser.authToken,
		cleanup: async () => {
			// Best-effort cleanup via GraphQL delete (admin privileges required)
			try {
				const { cachedAdminToken } = await getAdminAuthTokenAndId();
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: { authorization: `bearer ${cachedAdminToken}` },
					variables: { input: { id: regularUser.userId } },
				});
			} catch {}
			trackedUserIds.delete(regularUser.userId);
		},
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
	trackedPostIds.add(postId);

	return {
		postId,
		cleanup: async () => {
			trackedPostIds.delete(postId);
		},
	};
}

async function waitForNotifications(
	userId: string,
	authToken: string,
	timeoutMs = 10000,
): Promise<
	Array<{ id: string | null; isRead: boolean | null; readAt: string | null }>
> {
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

		if (
			notificationsResult.data?.user?.notifications &&
			notificationsResult.data.user.notifications.length > 0
		) {
			return notificationsResult.data.user.notifications;
		}

		await new Promise((resolve) => setTimeout(resolve, 100));
	}
	return [];
}

suite("Query user notifications", () => {
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
					// eslint-disable-next-line no-console
					console.error("Cleanup failed:", error);
				}
			}
			// Reset the cleanup functions array
			testCleanupFunctions.length = 0;
			await deepCleanup();
		});

		test("Returns an error when the user is unauthenticated", async () => {
			const testUser = await createTestUser();
			testCleanupFunctions.push(testUser.cleanup);

			const notificationsResult = await mercuriusClient.query(
				Query_user_notifications,
				{
					variables: {
						input: { id: testUser.userId },
						notificationInput: { first: 20 },
					},
				},
			);

			expect(notificationsResult.errors).toBeDefined();
			expect(notificationsResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: expect.arrayContaining(["user", "notifications"]),
					}),
				]),
			);
		});

		test("Returns an error when the user is present in the token but not found in the database", async () => {
			// Create a regular user
			const testUser = await createTestUser();
			testCleanupFunctions.push(testUser.cleanup);

			// Delete the user from database via GraphQL mutation using admin auth
			const { cachedAdminToken: adminAuthForDelete } =
				await getAdminAuthTokenAndId();
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminAuthForDelete}` },
				variables: { input: { id: testUser.userId } },
			});

			// Try to query notifications
			const notificationsResult = await mercuriusClient.query(
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

			expect(notificationsResult.errors).toBeDefined();
			// When the parent user resource is missing, the error is raised at the `user` field
			expect(notificationsResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining(["input", "id"]),
								}),
							]),
						}),
						message: expect.any(String),
						path: expect.arrayContaining(["user"]),
					}),
				]),
			);
		});

		test("Returns an error when trying to access another user's notifications", async () => {
			// Create two users
			const testUser1 = await createTestUser();
			testCleanupFunctions.push(testUser1.cleanup);

			const testUser2 = await createTestUser();
			testCleanupFunctions.push(testUser2.cleanup);

			// User1 tries to access User2's notifications
			const notificationsResult = await mercuriusClient.query(
				Query_user_notifications,
				{
					headers: {
						authorization: `bearer ${testUser1.authToken}`,
					},
					variables: {
						input: { id: testUser2.userId },
						notificationInput: { first: 20 },
					},
				},
			);

			expect(notificationsResult.errors).toBeDefined();
			expect(notificationsResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: expect.arrayContaining(["user", "notifications"]),
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
					// eslint-disable-next-line no-console
					console.error("Cleanup failed:", error);
				}
			}
			// Reset the cleanup functions array
			testCleanupFunctions.length = 0;
			await deepCleanup();
		});

		test("Returns an error when userId is not a valid UUID", async () => {
			const testUser = await createTestUser();
			testCleanupFunctions.push(testUser.cleanup);

			const notificationsResult = await mercuriusClient.query(
				Query_user_notifications,
				{
					headers: {
						authorization: `bearer ${testUser.authToken}`,
					},
					variables: {
						input: { id: "invalid-uuid" },
						notificationInput: { first: 20 },
					},
				},
			);

			expect(notificationsResult.errors).toBeDefined();
			expect(notificationsResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining(["input", "id"]),
								}),
							]),
						}),
						message: expect.any(String),
					}),
				]),
			);
		});

		test("Returns an error when first parameter is invalid", async () => {
			const testUser = await createTestUser();
			testCleanupFunctions.push(testUser.cleanup);

			const notificationsResult = await mercuriusClient.query(
				Query_user_notifications,
				{
					headers: {
						authorization: `bearer ${testUser.authToken}`,
					},
					variables: {
						input: { id: testUser.userId },
						notificationInput: { first: 0 }, // Invalid: should be min 1
					},
				},
			);

			expect(notificationsResult.errors).toBeDefined();
			expect(notificationsResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining(["input", "first"]),
								}),
							]),
						}),
						message: expect.any(String),
					}),
				]),
			);
		});

		test("Returns an error when first parameter exceeds maximum", async () => {
			const testUser = await createTestUser();
			testCleanupFunctions.push(testUser.cleanup);

			const notificationsResult = await mercuriusClient.query(
				Query_user_notifications,
				{
					headers: {
						authorization: `bearer ${testUser.authToken}`,
					},
					variables: {
						input: { id: testUser.userId },
						notificationInput: { first: 101 }, // Invalid: max is 100
					},
				},
			);

			expect(notificationsResult.errors).toBeDefined();
			expect(notificationsResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining(["input", "first"]),
								}),
							]),
						}),
						message: expect.any(String),
					}),
				]),
			);
		});

		test("Returns an error when skip parameter is negative", async () => {
			const testUser = await createTestUser();
			testCleanupFunctions.push(testUser.cleanup);

			const notificationsResult = await mercuriusClient.query(
				Query_user_notifications,
				{
					headers: {
						authorization: `bearer ${testUser.authToken}`,
					},
					variables: {
						input: { id: testUser.userId },
						notificationInput: { skip: -1 }, // Invalid: min is 0
					},
				},
			);

			expect(notificationsResult.errors).toBeDefined();
			expect(notificationsResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining(["input", "skip"]),
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
					// eslint-disable-next-line no-console
					console.error("Cleanup failed:", error);
				}
			}
			testCleanupFunctions.length = 0;
			await deepCleanup();
		});

		test("Returns empty array when user has no notifications", async () => {
			const testUser = await createTestUser();
			testCleanupFunctions.push(testUser.cleanup);

			const notificationsResult = await mercuriusClient.query(
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

			expect(notificationsResult.errors).toBeUndefined();
			expect(notificationsResult.data).toBeDefined();
			assertToBeNonNullish(notificationsResult.data);
			expect(notificationsResult.data.user?.notifications).toEqual([]);
		});

		test("Successfully returns notifications when user has notifications from post creation", async () => {
			const organization = await createTestOrganization();
			testCleanupFunctions.push(organization.cleanup);

			const testUser = await createTestUser();
			testCleanupFunctions.push(testUser.cleanup);

			const { cachedAdminToken: adminAuthMembership1 } =
				await getAdminAuthTokenAndId();
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${adminAuthMembership1}` },
				variables: {
					input: {
						memberId: testUser.userId,
						organizationId: organization.orgId,
						role: "regular",
					},
				},
			});

			const { cachedAdminToken: adminAuthToken } =
				await getAdminAuthTokenAndId();
			const post = await createTestPost(organization.orgId, adminAuthToken);
			testCleanupFunctions.push(post.cleanup);

			const notifications = await waitForNotifications(
				testUser.userId,
				testUser.authToken,
			);

			expect(notifications.length).toBeGreaterThan(0);

			const notificationsResult = await mercuriusClient.query(
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

			expect(notificationsResult.errors).toBeUndefined();
			expect(notificationsResult.data).toBeDefined();
			assertToBeNonNullish(notificationsResult.data);
			expect(notificationsResult.data.user?.notifications).toBeDefined();

			const returnedNotifications =
				notificationsResult.data.user?.notifications;
			expect(returnedNotifications?.length).toBeGreaterThan(0);

			const firstNotification = returnedNotifications?.[0];
			expect(firstNotification).toBeDefined();
			assertToBeNonNullish(firstNotification);
			expect(firstNotification.id).toBeDefined();
			expect(typeof firstNotification.isRead).toBe("boolean");
			expect(firstNotification.eventType).toBeDefined();
			expect(firstNotification.title).toBeDefined();
			expect(firstNotification.body).toBeDefined();
			expect(firstNotification.createdAt).toBeDefined();

			expect(firstNotification.isRead).toBe(false);
			expect(firstNotification.readAt).toBeNull();
		});

		test("Respects pagination with first parameter", async () => {
			// Create test organization
			const organization = await createTestOrganization();
			testCleanupFunctions.push(organization.cleanup);

			// Create test user and make them member of organization
			const testUser = await createTestUser();
			testCleanupFunctions.push(testUser.cleanup);

			// Add user to organization
			const { cachedAdminToken: adminAuthMembership2 } =
				await getAdminAuthTokenAndId();
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${adminAuthMembership2}` },
				variables: {
					input: {
						memberId: testUser.userId,
						organizationId: organization.orgId,
						role: "regular",
					},
				},
			});

			const { cachedAdminToken: adminAuthToken } =
				await getAdminAuthTokenAndId();
			const post1 = await createTestPost(organization.orgId, adminAuthToken);
			testCleanupFunctions.push(post1.cleanup);

			const post2 = await createTestPost(organization.orgId, adminAuthToken);
			testCleanupFunctions.push(post2.cleanup);

			const post3 = await createTestPost(organization.orgId, adminAuthToken);
			testCleanupFunctions.push(post3.cleanup);

			await waitForNotifications(testUser.userId, testUser.authToken);

			const notificationsResult = await mercuriusClient.query(
				Query_user_notifications,
				{
					headers: {
						authorization: `bearer ${testUser.authToken}`,
					},
					variables: {
						input: { id: testUser.userId },
						notificationInput: { first: 2 },
					},
				},
			);

			expect(notificationsResult.errors).toBeUndefined();
			expect(notificationsResult.data).toBeDefined();
			assertToBeNonNullish(notificationsResult.data);

			const notifications = notificationsResult.data.user?.notifications;
			expect(notifications).toBeDefined();
			expect(notifications?.length).toBeLessThanOrEqual(2);
		});

		test("Respects pagination with skip parameter", async () => {
			const organization = await createTestOrganization();
			testCleanupFunctions.push(organization.cleanup);

			const testUser = await createTestUser();
			testCleanupFunctions.push(testUser.cleanup);

			const { cachedAdminToken: adminAuthMembership3 } =
				await getAdminAuthTokenAndId();
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${adminAuthMembership3}` },
				variables: {
					input: {
						memberId: testUser.userId,
						organizationId: organization.orgId,
						role: "regular",
					},
				},
			});

			const { cachedAdminToken: adminAuthToken2 } =
				await getAdminAuthTokenAndId();
			const post1 = await createTestPost(organization.orgId, adminAuthToken2);
			testCleanupFunctions.push(post1.cleanup);

			const post2 = await createTestPost(organization.orgId, adminAuthToken2);
			testCleanupFunctions.push(post2.cleanup);

			await waitForNotifications(testUser.userId, testUser.authToken);

			const allNotificationsResult = await mercuriusClient.query(
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

			const totalNotifications =
				allNotificationsResult.data?.user?.notifications?.length || 0;

			if (totalNotifications > 1) {
				const skippedNotificationsResult = await mercuriusClient.query(
					Query_user_notifications,
					{
						headers: {
							authorization: `bearer ${testUser.authToken}`,
						},
						variables: {
							input: { id: testUser.userId },
							notificationInput: { skip: 1, first: 20 },
						},
					},
				);

				expect(skippedNotificationsResult.errors).toBeUndefined();
				expect(skippedNotificationsResult.data).toBeDefined();
				assertToBeNonNullish(skippedNotificationsResult.data);

				const skippedNotifications =
					skippedNotificationsResult.data.user?.notifications;
				expect(skippedNotifications).toBeDefined();
				expect(skippedNotifications?.length).toBe(totalNotifications - 1);
			}
		});

		test("Notifications are ordered by creation date (most recent first)", async () => {
			const organization = await createTestOrganization();
			testCleanupFunctions.push(organization.cleanup);

			const testUser = await createTestUser();
			testCleanupFunctions.push(testUser.cleanup);

			const { cachedAdminToken: adminAuthMembership4 } =
				await getAdminAuthTokenAndId();
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${adminAuthMembership4}` },
				variables: {
					input: {
						memberId: testUser.userId,
						organizationId: organization.orgId,
						role: "regular",
					},
				},
			});

			const { cachedAdminToken: adminAuthToken3 } =
				await getAdminAuthTokenAndId();
			const post1 = await createTestPost(organization.orgId, adminAuthToken3);
			testCleanupFunctions.push(post1.cleanup);

			await new Promise((resolve) => setTimeout(resolve, 100));

			const post2 = await createTestPost(organization.orgId, adminAuthToken3);
			testCleanupFunctions.push(post2.cleanup);

			await waitForNotifications(testUser.userId, testUser.authToken);

			const notificationsResult = await mercuriusClient.query(
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

			expect(notificationsResult.errors).toBeUndefined();
			expect(notificationsResult.data).toBeDefined();
			assertToBeNonNullish(notificationsResult.data);

			const notifications = notificationsResult.data.user?.notifications;
			expect(notifications).toBeDefined();

			if (notifications && notifications.length >= 2) {
				for (let i = 0; i < notifications.length - 1; i++) {
					const currentNotificationDate = new Date(
						notifications[i]?.createdAt || "",
					);
					const nextNotificationDate = new Date(
						notifications[i + 1]?.createdAt || "",
					);
					expect(currentNotificationDate.getTime()).toBeGreaterThanOrEqual(
						nextNotificationDate.getTime(),
					);
				}
			}
		});

		test("Uses default pagination when no parameters provided", async () => {
			const organization = await createTestOrganization();
			testCleanupFunctions.push(organization.cleanup);

			const testUser = await createTestUser();
			testCleanupFunctions.push(testUser.cleanup);

			const { cachedAdminToken: adminAuthMembership5 } =
				await getAdminAuthTokenAndId();
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${adminAuthMembership5}` },
				variables: {
					input: {
						memberId: testUser.userId,
						organizationId: organization.orgId,
						role: "regular",
					},
				},
			});

			const { cachedAdminToken: adminAuthToken4 } =
				await getAdminAuthTokenAndId();
			const post = await createTestPost(organization.orgId, adminAuthToken4);
			testCleanupFunctions.push(post.cleanup);

			await waitForNotifications(testUser.userId, testUser.authToken);

			const notificationsResult = await mercuriusClient.query(
				Query_user_notifications,
				{
					headers: {
						authorization: `bearer ${testUser.authToken}`,
					},
					variables: {
						input: { id: testUser.userId },
						notificationInput: {},
					},
				},
			);

			expect(notificationsResult.errors).toBeUndefined();
			expect(notificationsResult.data).toBeDefined();
			assertToBeNonNullish(notificationsResult.data);

			const notifications = notificationsResult.data.user?.notifications;
			expect(notifications).toBeDefined();
			expect(notifications?.length).toBeLessThanOrEqual(20);
		});
	});
});
