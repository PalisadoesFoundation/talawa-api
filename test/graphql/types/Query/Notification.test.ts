import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, expect, suite, test, vi } from "vitest";
import { notificationAudienceTable } from "~/src/drizzle/tables/NotificationAudience";
import { notificationLogsTable } from "~/src/drizzle/tables/NotificationLog";
import { notificationTemplatesTable } from "~/src/drizzle/tables/NotificationTemplate";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createPost,
	Mutation_createUser,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Query_signIn,
	Query_user_notifications,
} from "../documentNodes";

// The `?? 20` fallback in Notification.ts (line 101) is unreachable through
// normal GraphQL calls because Pothos always injects defaultValue: 20.
// This hoisted flag lets a single test force `first` to undefined so the
// defensive fallback branch is exercised.
const { mockFirstUndefined } = vi.hoisted(() => ({
	mockFirstUndefined: { value: false },
}));

vi.mock(
	"~/src/graphql/inputs/QueryNotificationInput",
	async (importOriginal) => {
		const orig =
			await importOriginal<
				typeof import("~/src/graphql/inputs/QueryNotificationInput")
			>();
		return {
			...orig,
			queryNotificationInputSchema: orig.queryNotificationInputSchema.transform(
				(data) => {
					if (mockFirstUndefined.value) {
						return { ...data, first: undefined };
					}
					return data;
				},
			),
		};
	},
);

suite("Query field user.notifications", () => {
	const cleanups: Array<() => Promise<void>> = [];

	afterEach(async () => {
		vi.restoreAllMocks();
		for (const cleanup of cleanups.reverse()) {
			try {
				await cleanup();
			} catch (error) {
				console.error("Cleanup failed:", error);
			}
		}
		cleanups.length = 0;
		// Configurable delay to allow asynchronous DB operations (e.g., cascade deletes) to settle.
		const cleanupSettleMs = Number(process.env.TEST_CLEANUP_SETTLE_MS ?? "50");
		if (cleanupSettleMs > 0) {
			await new Promise((r) => setTimeout(r, cleanupSettleMs));
		}
	});

	/**
	 * Signs in the admin user and returns a fresh auth token per test.
	 */
	async function getAdminToken(): Promise<string> {
		const adminSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		const token = adminSignIn.data?.signIn?.authenticationToken as string;
		assertToBeNonNullish(token);
		return token;
	}

	/**
	 * Creates a fresh notification template for "post_created" / "in_app".
	 * Always inserts a new template (no check-then-insert race condition).
	 * Returns the template ID. Registers cleanup to remove it.
	 */
	async function createNotificationTemplate(): Promise<string> {
		const [inserted] = await server.drizzleClient
			.insert(notificationTemplatesTable)
			.values({
				name: `New Post Created ${faker.string.uuid()}`,
				eventType: "post_created",
				title: "New post by {authorName}",
				body: '{authorName} has created a new post in {organizationName}: "{postCaption}"',
				channelType: "in_app",
				linkedRouteName: "/post/{postId}",
			})
			.returning({ id: notificationTemplatesTable.id });
		assertToBeNonNullish(inserted);
		cleanups.push(async () => {
			await server.drizzleClient
				.delete(notificationTemplatesTable)
				.where(eq(notificationTemplatesTable.id, inserted.id));
		});
		return inserted.id;
	}

	/**
	 * Creates a regular user and registers cleanup to delete them.
	 */
	async function createUser(adminToken: string) {
		const userRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `u${faker.string.uuid()}@e.com`,
					isEmailAddressVerified: true,
					name: faker.person.firstName(),
					password: "password",
					role: "regular",
				},
			},
		});
		const userId = userRes.data?.createUser?.user?.id as string;
		const userToken = userRes.data?.createUser?.authenticationToken as string;
		assertToBeNonNullish(userId);
		assertToBeNonNullish(userToken);

		cleanups.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: userId } },
			});
		});

		return { userId, userToken };
	}

	/**
	 * Creates an organization, adds the given user as a member, and registers
	 * cleanup. Deleting the org cascades to memberships and posts.
	 */
	async function createOrgWithMember(
		adminToken: string,
		memberId: string,
	): Promise<string> {
		const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { name: `Org ${faker.string.uuid()}`, countryCode: "us" },
			},
		});
		const orgId = orgRes.data?.createOrganization?.id as string;
		assertToBeNonNullish(orgId);

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { memberId, organizationId: orgId, role: "regular" },
			},
		});

		cleanups.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: orgId } },
			});
		});

		return orgId;
	}

	/**
	 * Polls for notifications until at least minCount are available.
	 * Throws a descriptive error if the timeout is reached.
	 */
	async function waitForNotifications(
		userToken: string,
		userId: string,
		minCount: number,
		timeoutMs = 20000,
	) {
		let list: Array<Record<string, unknown>> = [];
		const start = Date.now();
		while (Date.now() - start < timeoutMs) {
			const res = await mercuriusClient.query(Query_user_notifications, {
				headers: { authorization: `bearer ${userToken}` },
				variables: {
					input: { id: userId },
					notificationInput: { first: 20 },
				},
			});
			list = res.data?.user?.notifications ?? [];
			if (list.length >= minCount) break;
			await new Promise((r) => setTimeout(r, 200));
		}
		if (list.length < minCount) {
			throw new Error(
				`waitForNotifications timed out after ${timeoutMs}ms for user ${userId}: ` +
					`expected at least ${minCount} notifications but got ${list.length}`,
			);
		}
		return list;
	}

	/**
	 * Inserts `count` notification_logs + notification_audience rows directly
	 * for deterministic pagination testing (no async pipeline dependency).
	 * Uses explicit createdAt values spaced 1 second apart to guarantee
	 * distinct timestamps without relying on wall-clock delays.
	 */
	async function insertNotificationsForUser(
		userId: string,
		templateId: string,
		count: number,
	): Promise<void> {
		const baseTime = new Date("2025-01-01T10:00:00Z").getTime();
		for (let i = 0; i < count; i++) {
			const [log] = await server.drizzleClient
				.insert(notificationLogsTable)
				.values({
					templateId,
					renderedContent: { title: `Title ${i}`, body: `Body ${i}` },
					eventType: "post_created",
					channel: "in_app",
					status: "delivered",
					navigation: null,
					sender: null,
					createdAt: new Date(baseTime - i * 1000),
				})
				.returning({ id: notificationLogsTable.id });
			assertToBeNonNullish(log);

			await server.drizzleClient.insert(notificationAudienceTable).values({
				notificationId: log.id,
				userId,
				isRead: false,
			});

			cleanups.push(async () => {
				await server.drizzleClient
					.delete(notificationAudienceTable)
					.where(eq(notificationAudienceTable.notificationId, log.id));
				await server.drizzleClient
					.delete(notificationLogsTable)
					.where(eq(notificationLogsTable.id, log.id));
			});
		}
	}

	/**
	 * Returns a base user row object matching the usersTable schema.
	 * Avoids brittle per-column mocks that break when columns are added.
	 */
	function buildMockUserRow(overrides: Record<string, unknown> = {}) {
		return {
			id: faker.string.uuid(),
			emailAddress: "mock@test.com",
			name: "mock",
			role: "regular" as const,
			isEmailAddressVerified: true,
			passwordHash: "",
			createdAt: new Date("2025-01-01T00:00:00Z"),
			updatedAt: null,
			addressLine1: null,
			addressLine2: null,
			birthDate: null,
			city: null,
			countryCode: null,
			description: null,
			educationGrade: null,
			employmentStatus: null,
			homePhoneNumber: null,
			maritalStatus: null,
			mobilePhoneNumber: null,
			natalSex: null,
			postalCode: null,
			state: null,
			workPhoneNumber: null,
			avatarMimeType: null,
			avatarName: null,
			...overrides,
		};
	}

	test("unauthenticated -> unauthenticated error", async () => {
		const adminToken = await getAdminToken();
		const { userId } = await createUser(adminToken);

		const res = await mercuriusClient.query(Query_user_notifications, {
			variables: { input: { id: userId }, notificationInput: { first: 5 } },
		});

		expect(res.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
				}),
			]),
		);
	});

	test("invalid arguments (invalid user id UUID)", async () => {
		const adminToken = await getAdminToken();
		const { userToken } = await createUser(adminToken);

		const res = await mercuriusClient.query(Query_user_notifications, {
			headers: { authorization: `bearer ${userToken}` },
			variables: {
				input: { id: "not-a-uuid" },
				notificationInput: { first: 5 },
			},
		});

		expect(res.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "invalid_arguments" }),
				}),
			]),
		);
	});

	test("invalid arguments (first=0)", async () => {
		const adminToken = await getAdminToken();
		const { userId, userToken } = await createUser(adminToken);

		const res = await mercuriusClient.query(Query_user_notifications, {
			headers: { authorization: `bearer ${userToken}` },
			variables: { input: { id: userId }, notificationInput: { first: 0 } },
		});

		expect(res.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "invalid_arguments" }),
				}),
			]),
		);
	});

	test("user id mismatch -> unauthenticated", async () => {
		const adminToken = await getAdminToken();
		const { userToken } = await createUser(adminToken);
		const { userId: otherUserId } = await createUser(adminToken);

		const res = await mercuriusClient.query(Query_user_notifications, {
			headers: { authorization: `bearer ${userToken}` },
			variables: {
				input: { id: otherUserId },
				notificationInput: { first: 5 },
			},
		});

		expect(res.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
				}),
			]),
		);
	});

	test("current user not found in database -> unauthenticated", async () => {
		const adminToken = await getAdminToken();
		const { userId, userToken } = await createUser(adminToken);

		const spy = vi
			.spyOn(server.drizzleClient.query.usersTable, "findFirst")
			.mockResolvedValueOnce(buildMockUserRow({ id: userId }) as never)
			.mockResolvedValueOnce(undefined);

		try {
			const res = await mercuriusClient.query(Query_user_notifications, {
				headers: { authorization: `bearer ${userToken}` },
				variables: {
					input: { id: userId },
					notificationInput: { first: 5 },
				},
			});

			expect(res.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
					}),
				]),
			);
		} finally {
			spy.mockRestore();
		}
	});

	test("authenticated user deleted -> arguments_associated_resources_not_found", async () => {
		const adminToken = await getAdminToken();
		const userRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `u${faker.string.uuid()}@e.com`,
					isEmailAddressVerified: true,
					name: "Del",
					password: "password",
					role: "regular",
				},
			},
		});
		const userId = userRes.data?.createUser?.user?.id as string;
		const authToken = userRes.data?.createUser?.authenticationToken as string;
		assertToBeNonNullish(userId);
		assertToBeNonNullish(authToken);

		// Register cleanup immediately so the user is removed even if the
		// explicit delete below throws.
		cleanups.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: userId } },
			});
		});

		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { id: userId } },
		});

		const res = await mercuriusClient.query(Query_user_notifications, {
			headers: { authorization: `bearer ${authToken}` },
			variables: { input: { id: userId }, notificationInput: { first: 5 } },
		});

		expect(res.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
					}),
				}),
			]),
		);
	});

	test("returns empty array when no notifications exist", async () => {
		const adminToken = await getAdminToken();
		const { userId, userToken } = await createUser(adminToken);

		const res = await mercuriusClient.query(Query_user_notifications, {
			headers: { authorization: `bearer ${userToken}` },
			variables: { input: { id: userId }, notificationInput: { first: 5 } },
		});

		expect(res.errors).toBeUndefined();
		expect(res.data?.user?.notifications).toEqual([]);
	});

	test("uses default limit when first is omitted", async () => {
		const adminToken = await getAdminToken();
		const { userId, userToken } = await createUser(adminToken);

		const res = await mercuriusClient.query(Query_user_notifications, {
			headers: { authorization: `bearer ${userToken}` },
			variables: {
				input: { id: userId },
				notificationInput: {},
			},
		});

		expect(res.errors).toBeUndefined();
		expect(res.data?.user?.notifications).toEqual([]);
	});

	test("falls back to limit 20 when first is forced undefined (branch coverage)", async () => {
		const adminToken = await getAdminToken();
		const templateId = await createNotificationTemplate();
		const { userId, userToken } = await createUser(adminToken);

		// Insert 25 notifications so the fallback limit of 20 actually caps results.
		await insertNotificationsForUser(userId, templateId, 25);

		mockFirstUndefined.value = true;
		try {
			const res = await mercuriusClient.query(Query_user_notifications, {
				headers: { authorization: `bearer ${userToken}` },
				variables: {
					input: { id: userId },
					notificationInput: { first: 5 },
				},
			});

			expect(res.errors).toBeUndefined();
			// The mock forces first=undefined, so the resolver uses ?? 20.
			expect(res.data?.user?.notifications?.length).toBe(20);
		} finally {
			mockFirstUndefined.value = false;
		}
	});

	test("notification with null renderedContent returns default values", async () => {
		const adminToken = await getAdminToken();
		const templateId = await createNotificationTemplate();
		const { userId, userToken } = await createUser(adminToken);

		const [insertedLog] = await server.drizzleClient
			.insert(notificationLogsTable)
			.values({
				templateId,
				renderedContent: null,
				eventType: "post_created",
				channel: "in_app",
				status: "sent",
				navigation: null,
				sender: null,
			})
			.returning({ id: notificationLogsTable.id });

		assertToBeNonNullish(insertedLog);

		await server.drizzleClient.insert(notificationAudienceTable).values({
			notificationId: insertedLog.id,
			userId,
			isRead: false,
		});

		cleanups.push(async () => {
			await server.drizzleClient
				.delete(notificationAudienceTable)
				.where(eq(notificationAudienceTable.notificationId, insertedLog.id));
			await server.drizzleClient
				.delete(notificationLogsTable)
				.where(eq(notificationLogsTable.id, insertedLog.id));
		});

		const res = await mercuriusClient.query(Query_user_notifications, {
			headers: { authorization: `bearer ${userToken}` },
			variables: { input: { id: userId }, notificationInput: { first: 5 } },
		});

		expect(res.errors).toBeUndefined();
		const notifications = res.data?.user?.notifications ?? [];
		expect(notifications.length).toBe(1);
		expect(notifications[0]?.title).toBe("Notification");
		expect(notifications[0]?.body).toBe("");
		expect(notifications[0]?.eventType).toBe("post_created");
	});

	test("post creation generates notification with correct fields", async () => {
		const adminToken = await getAdminToken();
		await createNotificationTemplate();
		const { userId, userToken } = await createUser(adminToken);
		const orgId = await createOrgWithMember(adminToken, userId);

		await mercuriusClient.mutate(Mutation_createPost, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					organizationId: orgId,
					caption: `Post ${faker.lorem.words(3)}`,
				},
			},
		});

		const list = await waitForNotifications(userToken, userId, 1);

		expect(list.length).toBeGreaterThan(0);
		expect(list[0]?.eventType).toBe("post_created");
		expect(list[0]?.id).toBeDefined();
		expect(list[0]?.isRead).toBe(false);
		expect(list[0]?.createdAt).toBeDefined();
		expect(list[0]?.title).toContain("New post by");
		expect(list[0]?.body).toContain(
			server.envConfig.API_ADMINISTRATOR_USER_NAME,
		);
	}, 20000);

	test("pagination first limits results", async () => {
		const adminToken = await getAdminToken();
		const templateId = await createNotificationTemplate();
		const { userId, userToken } = await createUser(adminToken);

		await insertNotificationsForUser(userId, templateId, 3);

		const limited = await mercuriusClient.query(Query_user_notifications, {
			headers: { authorization: `bearer ${userToken}` },
			variables: { input: { id: userId }, notificationInput: { first: 2 } },
		});

		expect(limited.data?.user?.notifications?.length).toBe(2);
	});

	test("pagination skip offsets results", async () => {
		const adminToken = await getAdminToken();
		const templateId = await createNotificationTemplate();
		const { userId, userToken } = await createUser(adminToken);

		await insertNotificationsForUser(userId, templateId, 3);

		const all = await mercuriusClient.query(Query_user_notifications, {
			headers: { authorization: `bearer ${userToken}` },
			variables: {
				input: { id: userId },
				notificationInput: { first: 20 },
			},
		});
		const allList = all.data?.user?.notifications ?? [];
		expect(allList.length).toBe(3);

		const skipped = await mercuriusClient.query(Query_user_notifications, {
			headers: { authorization: `bearer ${userToken}` },
			variables: {
				input: { id: userId },
				notificationInput: { first: 2, skip: 1 },
			},
		});

		const skippedList = skipped.data?.user?.notifications ?? [];
		expect(skippedList.length).toBe(2);
		expect(skippedList[0]?.id).toBe(allList[1]?.id);
	});

	test("default pagination limit (20)", async () => {
		const adminToken = await getAdminToken();
		const templateId = await createNotificationTemplate();
		const { userId, userToken } = await createUser(adminToken);

		// Insert 25 notifications — more than the GraphQL defaultValue of 20 for `first`.
		await insertNotificationsForUser(userId, templateId, 25);

		const res = await mercuriusClient.query(Query_user_notifications, {
			headers: { authorization: `bearer ${userToken}` },
			variables: { input: { id: userId }, notificationInput: {} },
		});

		expect(res.errors).toBeUndefined();
		// GraphQL defaultValue of first=20 must cap the result.
		expect(res.data?.user?.notifications?.length).toBe(20);
	});

	test("notifications ordered desc by createdAt", async () => {
		const adminToken = await getAdminToken();
		const templateId = await createNotificationTemplate();
		const { userId, userToken } = await createUser(adminToken);

		await insertNotificationsForUser(userId, templateId, 3);

		const res = await mercuriusClient.query(Query_user_notifications, {
			headers: { authorization: `bearer ${userToken}` },
			variables: {
				input: { id: userId },
				notificationInput: { first: 20 },
			},
		});

		const all = res.data?.user?.notifications ?? [];
		expect(all.length).toBe(3);
		const createdAts = all.map((n) =>
			new Date(n.createdAt as string).getTime(),
		);
		const sorted = [...createdAts].sort((a, b) => b - a);
		expect(createdAts).toEqual(sorted);
	});
});
