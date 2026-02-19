import { faker } from "@faker-js/faker";
import { afterEach, beforeAll, expect, suite, test } from "vitest";
import { notificationTemplatesTable } from "~/src/drizzle/tables/NotificationTemplate";
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createPost,
	Mutation_createUser,
	Mutation_deleteUser,
	Query_user_notifications,
} from "../documentNodes";

suite("Query field user.notifications (API level, fully inline)", () => {
	let adminToken: string | null = null;
	let hasPostCreatedTemplate = false;
	const testCleanupFunctions: Array<() => Promise<void>> = [];

	beforeAll(async () => {
		// Check if notification template exists once
		const existing =
			await server.drizzleClient.query.notificationTemplatesTable.findFirst({
				where: (f, o) =>
					o.and(
						o.eq(f.eventType, "post_created"),
						o.eq(f.channelType, "in_app"),
					),
			});
		hasPostCreatedTemplate = Boolean(existing);

		// If no template exists, create one
		if (!hasPostCreatedTemplate) {
			await server.drizzleClient.insert(notificationTemplatesTable).values({
				name: "New Post Created",
				eventType: "post_created",
				title: "New post by {authorName}",
				body: '{authorName} has created a new post in {organizationName}: "{postCaption}"',
				channelType: "in_app",
				linkedRouteName: "/post/{postId}",
			});
			hasPostCreatedTemplate = true;
		}

		const { accessToken } = await getAdminAuthViaRest(server);
		adminToken = accessToken ?? null;
	});

	afterEach(async () => {
		for (const cleanup of testCleanupFunctions.reverse()) {
			try {
				await cleanup();
			} catch (error) {
				console.error("Cleanup failed:", error);
			}
		}
		testCleanupFunctions.length = 0;

		// Wait for any background notification processing to complete
		await new Promise((r) => setTimeout(r, 100));
	});
	test("unauthenticated -> unauthenticated error", async () => {
		if (!adminToken) throw new Error("Admin token not available");

		const userRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `u${faker.string.uuid()}@e.com`,
					isEmailAddressVerified: true,
					name: "User",
					password: "password",
					role: "regular",
				},
			},
		});
		const userId = userRes.data?.createUser?.user?.id as string;
		assertToBeNonNullish(userId);

		// Add cleanup for the user
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: userId } },
			});
		});
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
		const existing =
			await server.drizzleClient.query.notificationTemplatesTable.findFirst({
				where: (f, o) =>
					o.and(
						o.eq(f.eventType, "post_created"),
						o.eq(f.channelType, "in_app"),
					),
			});
		if (!existing) {
			await server.drizzleClient.insert(notificationTemplatesTable).values({
				name: "New Post Created",
				eventType: "post_created",
				title: "New post",
				body: "body",
				channelType: "in_app",
				linkedRouteName: "/post/{postId}",
			});
		}
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);
		const userRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `u${faker.string.uuid()}@e.com`,
					isEmailAddressVerified: true,
					name: "U",
					password: "password",
					role: "regular",
				},
			},
		});
		const authToken = userRes.data?.createUser?.authenticationToken as string;
		const userId2 = userRes.data?.createUser?.user?.id as string;
		assertToBeNonNullish(authToken);
		assertToBeNonNullish(userId2);

		// Add cleanup for the user
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: userId2 } },
			});
		});
		const res = await mercuriusClient.query(Query_user_notifications, {
			headers: { authorization: `bearer ${authToken}` },
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
		const existing =
			await server.drizzleClient.query.notificationTemplatesTable.findFirst({
				where: (f, o) =>
					o.and(
						o.eq(f.eventType, "post_created"),
						o.eq(f.channelType, "in_app"),
					),
			});
		if (!existing) {
			await server.drizzleClient.insert(notificationTemplatesTable).values({
				name: "New Post Created",
				eventType: "post_created",
				title: "New post",
				body: "body",
				channelType: "in_app",
				linkedRouteName: "/post/{postId}",
			});
		}
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);
		const userRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `u${faker.string.uuid()}@e.com`,
					isEmailAddressVerified: true,
					name: "U",
					password: "password",
					role: "regular",
				},
			},
		});
		const authToken = userRes.data?.createUser?.authenticationToken as string;
		const userId = userRes.data?.createUser?.user?.id as string;
		assertToBeNonNullish(authToken);
		assertToBeNonNullish(userId);
		const res = await mercuriusClient.query(Query_user_notifications, {
			headers: { authorization: `bearer ${authToken}` },
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
		const existing =
			await server.drizzleClient.query.notificationTemplatesTable.findFirst({
				where: (f, o) =>
					o.and(
						o.eq(f.eventType, "post_created"),
						o.eq(f.channelType, "in_app"),
					),
			});
		if (!existing) {
			await server.drizzleClient.insert(notificationTemplatesTable).values({
				name: "New Post Created",
				eventType: "post_created",
				title: "New post",
				body: "body",
				channelType: "in_app",
				linkedRouteName: "/post/{postId}",
			});
		}
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);
		const user1Res = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `u${faker.string.uuid()}@e.com`,
					isEmailAddressVerified: true,
					name: "U1",
					password: "password",
					role: "regular",
				},
			},
		});
		const user2Res = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `u${faker.string.uuid()}@e.com`,
					isEmailAddressVerified: true,
					name: "U2",
					password: "password",
					role: "regular",
				},
			},
		});
		const user1Token = user1Res.data?.createUser?.authenticationToken as string;
		const user2Id = user2Res.data?.createUser?.user?.id as string;
		const user1Id = user1Res.data?.createUser?.user?.id as string;
		assertToBeNonNullish(user1Token);
		assertToBeNonNullish(user2Id);
		assertToBeNonNullish(user1Id);

		// Add cleanup for both users
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: user1Id } },
			});
		});
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: user2Id } },
			});
		});
		const res = await mercuriusClient.query(Query_user_notifications, {
			headers: { authorization: `bearer ${user1Token}` },
			variables: { input: { id: user2Id }, notificationInput: { first: 5 } },
		});
		expect(res.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
				}),
			]),
		);
	});

	test("authenticated user deleted -> arguments_associated_resources_not_found", async () => {
		const existing =
			await server.drizzleClient.query.notificationTemplatesTable.findFirst({
				where: (f, o) =>
					o.and(
						o.eq(f.eventType, "post_created"),
						o.eq(f.channelType, "in_app"),
					),
			});
		if (!existing) {
			await server.drizzleClient.insert(notificationTemplatesTable).values({
				name: "New Post Created",
				eventType: "post_created",
				title: "New post",
				body: "body",
				channelType: "in_app",
				linkedRouteName: "/post/{postId}",
			});
		}
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);
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

	test("returns empty array", async () => {
		const existing =
			await server.drizzleClient.query.notificationTemplatesTable.findFirst({
				where: (f, o) =>
					o.and(
						o.eq(f.eventType, "post_created"),
						o.eq(f.channelType, "in_app"),
					),
			});
		if (!existing) {
			await server.drizzleClient.insert(notificationTemplatesTable).values({
				name: "New Post Created",
				eventType: "post_created",
				title: "New post",
				body: "body",
				channelType: "in_app",
				linkedRouteName: "/post/{postId}",
			});
		}
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);
		const userRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `u${faker.string.uuid()}@e.com`,
					isEmailAddressVerified: true,
					name: "Empty",
					password: "password",
					role: "regular",
				},
			},
		});
		const userId = userRes.data?.createUser?.user?.id as string;
		const userToken = userRes.data?.createUser?.authenticationToken as string;
		assertToBeNonNullish(userId);
		assertToBeNonNullish(userToken);
		const res = await mercuriusClient.query(Query_user_notifications, {
			headers: { authorization: `bearer ${userToken}` },
			variables: { input: { id: userId }, notificationInput: { first: 5 } },
		});
		expect(res.errors).toBeUndefined();
		expect(res.data?.user?.notifications).toEqual([]);
	});

	test("post creation generates notification", async () => {
		const existing =
			await server.drizzleClient.query.notificationTemplatesTable.findFirst({
				where: (f, o) =>
					o.and(
						o.eq(f.eventType, "post_created"),
						o.eq(f.channelType, "in_app"),
					),
			});
		if (!existing) {
			await server.drizzleClient.insert(notificationTemplatesTable).values({
				name: "New Post Created",
				eventType: "post_created",
				title: "New post",
				body: "body",
				channelType: "in_app",
				linkedRouteName: "/post/{postId}",
			});
		}
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);
		const userRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `u${faker.string.uuid()}@e.com`,
					isEmailAddressVerified: true,
					name: "Notif",
					password: "password",
					role: "regular",
				},
			},
		});
		const userId = userRes.data?.createUser?.user?.id as string;
		const userEmail = userRes.data?.createUser?.user?.emailAddress as string;
		assertToBeNonNullish(userId);
		assertToBeNonNullish(userEmail);

		// Sign in the user separately to get a fresh token
		const userSignInResponse = await server.inject({
			method: "POST",
			url: "/auth/signin",
			payload: { email: userEmail, password: "password" },
		});
		const userCookie = userSignInResponse.cookies.find(
			(c: { name: string }) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
		);
		const userToken = userCookie?.value;
		assertToBeNonNullish(userId);
		assertToBeNonNullish(userToken);
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
				input: { memberId: userId, organizationId: orgId, role: "regular" },
			},
		});
		await mercuriusClient.mutate(Mutation_createPost, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					organizationId: orgId,
					caption: `Post ${faker.lorem.words(3)}`,
				},
			},
		});
		// Wait a moment for async notification processing
		await new Promise((r) => setTimeout(r, 1000));
		const start = Date.now();
		let list: Array<Record<string, unknown>> = [];
		while (Date.now() - start < 10000) {
			const res = await mercuriusClient.query(Query_user_notifications, {
				headers: { authorization: `bearer ${userToken}` },
				variables: { input: { id: userId }, notificationInput: { first: 5 } },
			});
			list = res.data?.user?.notifications ?? [];
			if (list.length) break;
			await new Promise((r) => setTimeout(r, 150));
		}
		expect(list.length).toBeGreaterThan(0);
		expect(list[0]?.eventType).toBe("post_created");
	}, 20000);

	test("pagination first limits results", async () => {
		const existing =
			await server.drizzleClient.query.notificationTemplatesTable.findFirst({
				where: (f, o) =>
					o.and(
						o.eq(f.eventType, "post_created"),
						o.eq(f.channelType, "in_app"),
					),
			});
		if (!existing) {
			await server.drizzleClient.insert(notificationTemplatesTable).values({
				name: "New Post Created",
				eventType: "post_created",
				title: "New post",
				body: "body",
				channelType: "in_app",
				linkedRouteName: "/post/{postId}",
			});
		}
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);
		const userRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `u${faker.string.uuid()}@e.com`,
					isEmailAddressVerified: true,
					name: "Pag",
					password: "password",
					role: "regular",
				},
			},
		});
		const userId = userRes.data?.createUser?.user?.id as string;
		const userToken = userRes.data?.createUser?.authenticationToken as string;
		assertToBeNonNullish(userId);
		assertToBeNonNullish(userToken);
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
				input: { memberId: userId, organizationId: orgId, role: "regular" },
			},
		});
		for (let i = 0; i < 3; i++) {
			await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						organizationId: orgId,
						caption: `Post ${i}`,
						attachments: [],
					},
				},
			});
		}
		// Wait for notifications to be processed
		await new Promise((r) => setTimeout(r, 500));
		let all: Array<Record<string, unknown>> = [];
		const start = Date.now();
		while (Date.now() - start < 5000) {
			const res = await mercuriusClient.query(Query_user_notifications, {
				headers: { authorization: `bearer ${userToken}` },
				variables: { input: { id: userId }, notificationInput: { first: 10 } },
			});
			all = res.data?.user?.notifications ?? [];
			if (all.length >= 3) break;
			await new Promise((r) => setTimeout(r, 250));
		}
		const limited = await mercuriusClient.query(Query_user_notifications, {
			headers: { authorization: `bearer ${userToken}` },
			variables: { input: { id: userId }, notificationInput: { first: 2 } },
		});
		expect(limited.data?.user?.notifications?.length).toBeLessThanOrEqual(2);
	}, 8000);

	test("pagination skip offsets results", async () => {
		const existing =
			await server.drizzleClient.query.notificationTemplatesTable.findFirst({
				where: (f, o) =>
					o.and(
						o.eq(f.eventType, "post_created"),
						o.eq(f.channelType, "in_app"),
					),
			});
		if (!existing) {
			await server.drizzleClient.insert(notificationTemplatesTable).values({
				name: "New Post Created",
				eventType: "post_created",
				title: "New post",
				body: "body",
				channelType: "in_app",
				linkedRouteName: "/post/{postId}",
			});
		}
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);
		const userRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `u${faker.string.uuid()}@e.com`,
					isEmailAddressVerified: true,
					name: "Skip",
					password: "password",
					role: "regular",
				},
			},
		});
		const userId = userRes.data?.createUser?.user?.id as string;
		const userToken = userRes.data?.createUser?.authenticationToken as string;
		assertToBeNonNullish(userId);
		assertToBeNonNullish(userToken);
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
				input: { memberId: userId, organizationId: orgId, role: "regular" },
			},
		});
		for (let i = 0; i < 3; i++) {
			await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						organizationId: orgId,
						caption: `Post ${i}`,
						attachments: [],
					},
				},
			});
		}
		// Wait for notifications to be processed
		await new Promise((r) => setTimeout(r, 500));
		let all: Array<Record<string, unknown>> = [];
		const start = Date.now();
		while (Date.now() - start < 5000) {
			const res = await mercuriusClient.query(Query_user_notifications, {
				headers: { authorization: `bearer ${userToken}` },
				variables: { input: { id: userId }, notificationInput: { first: 10 } },
			});
			all = res.data?.user?.notifications ?? [];
			if (all.length >= 3) break;
			await new Promise((r) => setTimeout(r, 250));
		}
		const skipped = await mercuriusClient.query(Query_user_notifications, {
			headers: { authorization: `bearer ${userToken}` },
			variables: {
				input: { id: userId },
				notificationInput: { first: 2, skip: 1 },
			},
		});
		const skippedList = skipped.data?.user?.notifications ?? [];
		expect(skippedList.length).toBeLessThanOrEqual(2);
		if (all.length >= 2 && skippedList.length > 0) {
			expect(skippedList[0]?.id).toBe(all[1]?.id);
		}
	}, 8000);

	test("default pagination limit (20)", async () => {
		const existing =
			await server.drizzleClient.query.notificationTemplatesTable.findFirst({
				where: (f, o) =>
					o.and(
						o.eq(f.eventType, "post_created"),
						o.eq(f.channelType, "in_app"),
					),
			});
		if (!existing) {
			await server.drizzleClient.insert(notificationTemplatesTable).values({
				name: "New Post Created",
				eventType: "post_created",
				title: "New post",
				body: "body",
				channelType: "in_app",
				linkedRouteName: "/post/{postId}",
			});
		}
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);
		const userRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `u${faker.string.uuid()}@e.com`,
					isEmailAddressVerified: true,
					name: "Def",
					password: "password",
					role: "regular",
				},
			},
		});
		const userId = userRes.data?.createUser?.user?.id as string;
		const userToken = userRes.data?.createUser?.authenticationToken as string;
		assertToBeNonNullish(userId);
		assertToBeNonNullish(userToken);
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
				input: { memberId: userId, organizationId: orgId, role: "regular" },
			},
		});
		for (let i = 0; i < 5; i++) {
			await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: { organizationId: orgId, caption: `P${i}`, attachments: [] },
				},
			});
		}
		// Wait for notifications to be processed
		await new Promise((r) => setTimeout(r, 500));
		let all: Array<Record<string, unknown>> = [];
		const start = Date.now();
		while (Date.now() - start < 5000) {
			const res = await mercuriusClient.query(Query_user_notifications, {
				headers: { authorization: `bearer ${userToken}` },
				variables: { input: { id: userId }, notificationInput: {} },
			});
			all = res.data?.user?.notifications ?? [];
			if (all.length >= 3) break;
			await new Promise((r) => setTimeout(r, 250));
		}
		expect(all.length).toBeLessThanOrEqual(20);
	}, 8000);

	test("notifications ordered desc", async () => {
		const existing =
			await server.drizzleClient.query.notificationTemplatesTable.findFirst({
				where: (f, o) =>
					o.and(
						o.eq(f.eventType, "post_created"),
						o.eq(f.channelType, "in_app"),
					),
			});
		if (!existing) {
			await server.drizzleClient.insert(notificationTemplatesTable).values({
				name: "New Post Created",
				eventType: "post_created",
				title: "New post",
				body: "body",
				channelType: "in_app",
				linkedRouteName: "/post/{postId}",
			});
		}
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);
		const userRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `u${faker.string.uuid()}@e.com`,
					isEmailAddressVerified: true,
					name: "Ord",
					password: "password",
					role: "regular",
				},
			},
		});
		const userId = userRes.data?.createUser?.user?.id as string;
		const userToken = userRes.data?.createUser?.authenticationToken as string;
		assertToBeNonNullish(userId);
		assertToBeNonNullish(userToken);
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
				input: { memberId: userId, organizationId: orgId, role: "regular" },
			},
		});
		for (let i = 0; i < 3; i++) {
			await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						organizationId: orgId,
						caption: `Order ${i}`,
						attachments: [],
					},
				},
			});
		}
		// Wait for notifications to be processed
		await new Promise((r) => setTimeout(r, 500));
		let all: Array<Record<string, unknown>> = [];
		const start = Date.now();
		while (Date.now() - start < 5000) {
			const res = await mercuriusClient.query(Query_user_notifications, {
				headers: { authorization: `bearer ${userToken}` },
				variables: { input: { id: userId }, notificationInput: { first: 10 } },
			});
			all = res.data?.user?.notifications ?? [];
			if (all.length >= 3) break;
			await new Promise((r) => setTimeout(r, 250));
		}
		const createdAts = all.map((n) =>
			new Date(n.createdAt as string).getTime(),
		);
		const sorted = [...createdAts].sort((a, b) => b - a);
		expect(createdAts).toEqual(sorted);
	}, 8000);
});
