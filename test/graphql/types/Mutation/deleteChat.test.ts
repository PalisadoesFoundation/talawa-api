import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, expect, suite, test } from "vitest";
import { chatMembershipsTable } from "~/src/drizzle/tables/chatMemberships";
import { chatsTable } from "~/src/drizzle/tables/chats";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createChat,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteChat,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
} from "../documentNodes";

suite("Mutation deleteChat", () => {
	const cleanupFns: Array<() => Promise<void>> = [];

	afterEach(async () => {
		for (const fn of cleanupFns.reverse()) {
			try {
				await fn();
			} catch (err) {
				console.error("cleanup failed:", err);
			}
		}
		cleanupFns.length = 0;
	});

	beforeAll(async () => {
		// ensure admin exists by signing in
		if (!server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS) {
			throw new Error("admin env not set");
		}
	});

	test("successfully deletes chat and avatar", async () => {
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);

		// Create Org
		const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { name: `org-${faker.string.uuid()}`, countryCode: "us" },
			},
		});
		assertToBeNonNullish(orgRes.data?.createOrganization?.id);
		const orgId = orgRes.data.createOrganization.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: orgId } },
			});
		});

		// Create Chat
		const chatName = `chat-${faker.string.uuid()}`;
		const chatRes = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { name: chatName, organizationId: orgId },
			},
		});
		assertToBeNonNullish(chatRes.data?.createChat?.id);
		const chatId = chatRes.data.createChat.id;
		// Normally we'd add cleanup for chat, but we expect to delete it in the test.
		// We add a fallback cleanup just in case test fails before deletion.
		cleanupFns.push(async () => {
			try {
				await mercuriusClient.mutate(Mutation_deleteChat, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { id: chatId } },
				});
			} catch (_) {
				console.error(_);
			}
		});

		// Seed avatar in MinIO and DB
		const avatarName = `${chatId}-avatar.png`;
		await server.minio.client.putObject(
			server.minio.bucketName,
			avatarName,
			Buffer.from("fake-image"),
		);
		await server.drizzleClient
			.update(chatsTable)
			.set({ avatarName })
			.where(eq(chatsTable.id, chatId));

		// Verify avatar exists in MinIO
		await expect(
			server.minio.client.statObject(server.minio.bucketName, avatarName),
		).resolves.toBeDefined();

		// Delete Chat
		const deleteRes = await mercuriusClient.mutate(Mutation_deleteChat, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { id: chatId } },
		});
		assertToBeNonNullish(deleteRes.data?.deleteChat?.id);
		expect(deleteRes.data.deleteChat.id).toBe(chatId);

		// Verify Chat is gone from DB
		const dbChat = await server.drizzleClient.query.chatsTable.findFirst({
			where: eq(chatsTable.id, chatId),
		});
		expect(dbChat).toBeUndefined();

		// Verify Avatar is gone from MinIO
		await expect(
			server.minio.client.statObject(server.minio.bucketName, avatarName),
		).rejects.toThrow();
	});

	test("successfully deletes chat without avatar", async () => {
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);

		// Create Org
		const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { name: `org-${faker.string.uuid()}`, countryCode: "us" },
			},
		});
		assertToBeNonNullish(orgRes.data?.createOrganization?.id);
		const orgId = orgRes.data.createOrganization.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: orgId } },
			});
		});

		// Create Chat
		const chatName = `chat-${faker.string.uuid()}`;
		const chatRes = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { name: chatName, organizationId: orgId },
			},
		});
		assertToBeNonNullish(chatRes.data?.createChat?.id);
		const chatId = chatRes.data.createChat.id;
		cleanupFns.push(async () => {
			try {
				await mercuriusClient.mutate(Mutation_deleteChat, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { id: chatId } },
				});
			} catch (_) {
				console.error(_);
			}
		});

		// Delete Chat
		const deleteRes = await mercuriusClient.mutate(Mutation_deleteChat, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { id: chatId } },
		});
		assertToBeNonNullish(deleteRes.data?.deleteChat?.id);
		expect(deleteRes.data.deleteChat.id).toBe(chatId);

		// Verify Chat is gone from DB
		const dbChat = await server.drizzleClient.query.chatsTable.findFirst({
			where: eq(chatsTable.id, chatId),
		});
		expect(dbChat).toBeUndefined();
	});

	test("unauthenticated: requires auth", async () => {
		const res = await mercuriusClient.mutate(Mutation_deleteChat, {
			variables: {
				input: { id: faker.string.uuid() },
			},
		});
		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});

	test("invalid arguments: invalid UUID", async () => {
		// need token to pass auth check first
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);

		const res = await mercuriusClient.mutate(Mutation_deleteChat, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { id: "not-a-uuid" },
			},
		});
		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
	});

	test("arguments_associated_resources_not_found: chat does not exist", async () => {
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);

		const res = await mercuriusClient.mutate(Mutation_deleteChat, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { id: faker.string.uuid() },
			},
		});
		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
	});

	test("unauthorized: non-admin cannot delete chat", async () => {
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);

		// Create Org
		const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { name: `org-${faker.string.uuid()}`, countryCode: "us" },
			},
		});
		assertToBeNonNullish(orgRes.data?.createOrganization?.id);
		const orgId = orgRes.data.createOrganization.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: orgId } },
			});
		});

		// Create User (Member)
		const userRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `${faker.string.uuid()}@test.com`,
					name: faker.person.fullName(),
					password: "password123",
					role: "regular",
					isEmailAddressVerified: false,
				},
			},
		});
		assertToBeNonNullish(userRes.data?.createUser?.user?.id);
		const memberToken = userRes.data.createUser.authenticationToken;
		assertToBeNonNullish(memberToken);
		const memberId = userRes.data.createUser.user.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: memberId } },
			});
		});

		// Add User to Org (Regular)
		const membershipRes = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						memberId,
						organizationId: orgId,
						role: "regular",
					},
				},
			},
		);
		expect(membershipRes.errors).toBeUndefined();
		assertToBeNonNullish(membershipRes.data?.createOrganizationMembership?.id);

		// Verify membership role in DB to ensure test validity
		// We import organizationMembershipsTable here or just use the query API
		const dbMembership =
			await server.drizzleClient.query.organizationMembershipsTable.findFirst({
				where: (memberships, { eq, and }) =>
					and(
						eq(memberships.memberId, memberId),
						eq(memberships.organizationId, orgId),
					),
			});
		assertToBeNonNullish(dbMembership);
		expect(dbMembership.role).toBe("regular");

		// Create Chat (by Admin)
		const chatRes = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { name: `chat-${faker.string.uuid()}`, organizationId: orgId },
			},
		});
		assertToBeNonNullish(chatRes.data?.createChat?.id);
		const chatId = chatRes.data.createChat.id;
		cleanupFns.push(async () => {
			try {
				await mercuriusClient.mutate(Mutation_deleteChat, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { id: chatId } },
				});
			} catch (_) {
				console.error(_);
			}
		});

		// Attempt to delete by Member
		const res = await mercuriusClient.mutate(Mutation_deleteChat, {
			headers: { authorization: `bearer ${memberToken}` },
			variables: {
				input: { id: chatId },
			},
		});

		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe(
			"unauthorized_action_on_arguments_associated_resources",
		);
	});

	test("authorized: org-admin can delete chat", async () => {
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);

		// Create Org
		const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { name: `org-${faker.string.uuid()}`, countryCode: "us" },
			},
		});
		assertToBeNonNullish(orgRes.data?.createOrganization?.id);
		const orgId = orgRes.data.createOrganization.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: orgId } },
			});
		});

		// Create User (Org Admin)
		const userRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `${faker.string.uuid()}@test.com`,
					name: faker.person.fullName(),
					password: "password123",
					role: "regular",
					isEmailAddressVerified: false,
				},
			},
		});
		assertToBeNonNullish(userRes.data?.createUser?.user?.id);
		const memberToken = userRes.data.createUser.authenticationToken;
		assertToBeNonNullish(memberToken);
		const memberId = userRes.data.createUser.user.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: memberId } },
			});
		});

		// Add User to Org (Admin)
		const membershipRes = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						memberId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			},
		);
		expect(membershipRes.errors).toBeUndefined();
		assertToBeNonNullish(membershipRes.data?.createOrganizationMembership?.id);

		// Verify membership role in DB
		const dbMembership =
			await server.drizzleClient.query.organizationMembershipsTable.findFirst({
				where: (memberships, { eq, and }) =>
					and(
						eq(memberships.memberId, memberId),
						eq(memberships.organizationId, orgId),
					),
			});
		assertToBeNonNullish(dbMembership);
		expect(dbMembership.role).toBe("administrator");

		// Create Chat (by Super Admin)
		const chatRes = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { name: `chat-${faker.string.uuid()}`, organizationId: orgId },
			},
		});
		assertToBeNonNullish(chatRes.data?.createChat?.id);
		const chatId = chatRes.data.createChat.id;
		cleanupFns.push(async () => {
			try {
				await mercuriusClient.mutate(Mutation_deleteChat, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { id: chatId } },
				});
			} catch (_) {
				console.error(_);
			}
		});

		// Delete Chat as Org Admin
		const deleteRes = await mercuriusClient.mutate(Mutation_deleteChat, {
			headers: { authorization: `bearer ${memberToken}` },
			variables: { input: { id: chatId } },
		});

		expect(deleteRes.errors).toBeUndefined();
		assertToBeNonNullish(deleteRes.data?.deleteChat?.id);
		expect(deleteRes.data.deleteChat.id).toBe(chatId);

		// Verify Chat is gone from DB
		const dbChat = await server.drizzleClient.query.chatsTable.findFirst({
			where: eq(chatsTable.id, chatId),
		});
		expect(dbChat).toBeUndefined();
	});

	test("authorized: chat-admin can delete chat (non-org-admin member)", async () => {
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);

		// Create Org
		const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { name: `org-${faker.string.uuid()}`, countryCode: "us" },
			},
		});
		assertToBeNonNullish(orgRes.data?.createOrganization?.id);
		const orgId = orgRes.data.createOrganization.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: orgId } },
			});
		});

		// Create User (will be chat admin but NOT org admin)
		const userRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `${faker.string.uuid()}@test.com`,
					name: faker.person.fullName(),
					password: "password123",
					role: "regular",
					isEmailAddressVerified: false,
				},
			},
		});
		assertToBeNonNullish(userRes.data?.createUser?.user?.id);
		const chatAdminToken = userRes.data.createUser.authenticationToken;
		assertToBeNonNullish(chatAdminToken);
		const chatAdminId = userRes.data.createUser.user.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: chatAdminId } },
			});
		});

		// Add User to Org as REGULAR member (not org admin)
		const orgMembershipRes = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						memberId: chatAdminId,
						organizationId: orgId,
						role: "regular",
					},
				},
			},
		);
		expect(orgMembershipRes.errors).toBeUndefined();
		assertToBeNonNullish(
			orgMembershipRes.data?.createOrganizationMembership?.id,
		);

		// Verify org membership role is regular
		const dbOrgMembership =
			await server.drizzleClient.query.organizationMembershipsTable.findFirst({
				where: (memberships, { eq, and }) =>
					and(
						eq(memberships.memberId, chatAdminId),
						eq(memberships.organizationId, orgId),
					),
			});
		assertToBeNonNullish(dbOrgMembership);
		expect(dbOrgMembership.role).toBe("regular");

		// Create Chat (by Super Admin)
		const chatRes = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { name: `chat-${faker.string.uuid()}`, organizationId: orgId },
			},
		});
		assertToBeNonNullish(chatRes.data?.createChat?.id);
		const chatId = chatRes.data.createChat.id;
		cleanupFns.push(async () => {
			try {
				await mercuriusClient.mutate(Mutation_deleteChat, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { id: chatId } },
				});
			} catch (_) {
				console.error(_);
			}
		});

		// Add user to chat as chat ADMINISTRATOR
		await server.drizzleClient.insert(chatMembershipsTable).values({
			chatId,
			memberId: chatAdminId,
			role: "administrator",
			creatorId: chatAdminId,
		});

		// Verify chat membership role is administrator
		const dbChatMembership =
			await server.drizzleClient.query.chatMembershipsTable.findFirst({
				where: (memberships, { eq, and }) =>
					and(
						eq(memberships.memberId, chatAdminId),
						eq(memberships.chatId, chatId),
					),
			});
		assertToBeNonNullish(dbChatMembership);
		expect(dbChatMembership.role).toBe("administrator");

		// Delete Chat as Chat Admin (not org admin)
		const deleteRes = await mercuriusClient.mutate(Mutation_deleteChat, {
			headers: { authorization: `bearer ${chatAdminToken}` },
			variables: { input: { id: chatId } },
		});

		expect(deleteRes.errors).toBeUndefined();
		assertToBeNonNullish(deleteRes.data?.deleteChat?.id);
		expect(deleteRes.data.deleteChat.id).toBe(chatId);

		// Verify Chat is gone from DB
		const dbChat = await server.drizzleClient.query.chatsTable.findFirst({
			where: eq(chatsTable.id, chatId),
		});
		expect(dbChat).toBeUndefined();
	});

	test("unauthorized: regular chat member (non-admin) cannot delete chat", async () => {
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);

		// Create Org
		const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { name: `org-${faker.string.uuid()}`, countryCode: "us" },
			},
		});
		assertToBeNonNullish(orgRes.data?.createOrganization?.id);
		const orgId = orgRes.data.createOrganization.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: orgId } },
			});
		});

		// Create User
		const userRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `${faker.string.uuid()}@test.com`,
					name: faker.person.fullName(),
					password: "password123",
					role: "regular",
					isEmailAddressVerified: false,
				},
			},
		});
		assertToBeNonNullish(userRes.data?.createUser?.user?.id);
		const memberToken = userRes.data.createUser.authenticationToken;
		assertToBeNonNullish(memberToken);
		const memberId = userRes.data.createUser.user.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: memberId } },
			});
		});

		// Add User to Org as regular member
		const orgMembershipRes = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						memberId,
						organizationId: orgId,
						role: "regular",
					},
				},
			},
		);
		expect(orgMembershipRes.errors).toBeUndefined();
		assertToBeNonNullish(
			orgMembershipRes.data?.createOrganizationMembership?.id,
		);

		// Create Chat
		const chatRes = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { name: `chat-${faker.string.uuid()}`, organizationId: orgId },
			},
		});
		assertToBeNonNullish(chatRes.data?.createChat?.id);
		const chatId = chatRes.data.createChat.id;
		cleanupFns.push(async () => {
			try {
				await mercuriusClient.mutate(Mutation_deleteChat, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { id: chatId } },
				});
			} catch (_) {
				console.error(_);
			}
		});

		// Add user to chat as REGULAR member (not chat admin)
		await server.drizzleClient.insert(chatMembershipsTable).values({
			chatId,
			memberId,
			role: "regular",
			creatorId: memberId,
		});

		// Verify chat membership role is regular
		const dbChatMembership =
			await server.drizzleClient.query.chatMembershipsTable.findFirst({
				where: (memberships, { eq, and }) =>
					and(
						eq(memberships.memberId, memberId),
						eq(memberships.chatId, chatId),
					),
			});
		assertToBeNonNullish(dbChatMembership);
		expect(dbChatMembership.role).toBe("regular");

		// Attempt to delete chat as regular chat member
		const deleteRes = await mercuriusClient.mutate(Mutation_deleteChat, {
			headers: { authorization: `bearer ${memberToken}` },
			variables: { input: { id: chatId } },
		});

		expect(deleteRes.errors).toBeDefined();
		expect(deleteRes.errors?.[0]?.extensions?.code).toBe(
			"unauthorized_action_on_arguments_associated_resources",
		);
	});
});
