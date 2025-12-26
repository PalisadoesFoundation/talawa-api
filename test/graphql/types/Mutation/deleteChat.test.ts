import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, expect, suite, test } from "vitest";
import { chatsTable } from "~/src/drizzle/tables/chats";
import { assertToBeNonNullish } from "../../../helpers";
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
	Query_signIn,
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
		const adminRes = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(adminRes.data?.signIn?.authenticationToken);
		const adminToken = adminRes.data.signIn.authenticationToken as string;

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
				// ignore if already deleted
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
		const adminRes = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(adminRes.data?.signIn?.authenticationToken);
		const adminToken = adminRes.data.signIn.authenticationToken as string;

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
				// ignore if already deleted
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
		const adminRes = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(adminRes.data?.signIn?.authenticationToken);
		const adminToken = adminRes.data.signIn.authenticationToken as string;

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
		const adminRes = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(adminRes.data?.signIn?.authenticationToken);
		const adminToken = adminRes.data.signIn.authenticationToken as string;

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
		const adminRes = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(adminRes.data?.signIn?.authenticationToken);
		const adminToken = adminRes.data.signIn.authenticationToken as string;

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
				// ignore if already deleted
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
		const adminRes = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(adminRes.data?.signIn?.authenticationToken);
		const adminToken = adminRes.data.signIn.authenticationToken as string;

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
				// ignore if already deleted
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
});
