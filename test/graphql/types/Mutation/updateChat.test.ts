import { Readable } from "node:stream";
import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";

import { beforeAll, expect, suite, test, vi } from "vitest";

import { chatMembershipsTable } from "~/src/drizzle/schema";
import { chatsTable } from "~/src/drizzle/tables/chats";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { usersTable } from "~/src/drizzle/tables/users";

import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_updateChat,
	Query_signIn,
} from "../documentNodes";

async function createTestOrganization(): Promise<string> {
	const signIn = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});

	expect(signIn.errors ?? []).toEqual([]);

	const token = signIn.data?.signIn?.authenticationToken;
	expect(token).toBeDefined();

	const org = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${token}` },
		variables: {
			input: {
				name: `Org-${Date.now()}`,
				countryCode: "us",
				isUserRegistrationRequired: true,
			},
		},
	});

	expect(org.errors ?? []).toEqual([]);

	const orgId = org.data?.createOrganization?.id;
	expect(orgId).toBeDefined();

	return orgId as string;
}

suite("updateChat mutation", () => {
	let sharedUser: Awaited<ReturnType<typeof createRegularUserUsingAdmin>>;

	beforeAll(async () => {
		sharedUser = await createRegularUserUsingAdmin();
	});

	test("returns unauthenticated when user is not logged in", async () => {
		const result = await mercuriusClient.mutate(Mutation_updateChat, {
			variables: {
				input: {
					id: faker.string.uuid(),
					name: "New Name",
				},
			},
		});

		expect(result.data?.updateChat ?? null).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
				}),
			]),
		);
	});

	test("returns invalid_arguments for malformed input", async () => {
		const result = await mercuriusClient.mutate(Mutation_updateChat, {
			headers: { authorization: `bearer ${sharedUser.authToken}` },
			variables: {
				input: {
					id: "",
				},
			},
		});

		expect(result.data?.updateChat ?? null).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
				}),
			]),
		);
	});

	test("returns GraphQL validation error for invalid avatar mime type", async () => {
		const orgId = await createTestOrganization();
		const chatId = faker.string.uuid();

		await server.drizzleClient.insert(chatsTable).values({
			id: chatId,
			name: "Chat",
			organizationId: orgId,
			creatorId: sharedUser.userId,
		});

		await server.drizzleClient.insert(organizationMembershipsTable).values({
			memberId: sharedUser.userId,
			organizationId: orgId,
			role: "administrator",
		});

		const fakeUpload = Promise.resolve({
			filename: "evil.exe",
			mimetype: "application/x-msdownload",
			createReadStream: () => Readable.from("fake"),
		});

		const result = await mercuriusClient.mutate(Mutation_updateChat, {
			headers: { authorization: `bearer ${sharedUser.authToken}` },
			variables: {
				input: {
					id: chatId,
					avatar: fakeUpload,
				},
			},
		});

		expect(result.data?.updateChat ?? null).toBeNull();
		expect(result.errors).toBeDefined();

		const firstError = result.errors?.[0];
		expect(firstError).toBeDefined();
		expect(firstError?.message).toBe("Graphql validation error");
		expect(firstError?.extensions).toEqual(
			expect.objectContaining({
				code: "invalid_arguments",
				httpStatus: 400,
				correlationId: expect.any(String),
			}),
		);
	});

	test("successfully uploads and updates chat avatar with valid image", async () => {
		const user = await createRegularUserUsingAdmin();
		const orgId = await createTestOrganization();
		const chatId = faker.string.uuid();

		await server.drizzleClient.insert(chatsTable).values({
			id: chatId,
			name: "Chat",
			organizationId: orgId,
			creatorId: user.userId,
		});

		await server.drizzleClient.insert(organizationMembershipsTable).values({
			memberId: user.userId,
			organizationId: orgId,
			role: "administrator",
		});

		const boundary = `----WebKitFormBoundary${Math.random().toString(36).slice(2)}`;

		const operations = JSON.stringify({
			query: `
      mutation UpdateChat($input: MutationUpdateChatInput!) {
        updateChat(input: $input) {
          id
          avatarURL
        }
      }
    `,
			variables: {
				input: {
					id: chatId,
					avatar: null,
				},
			},
		});

		const map = JSON.stringify({
			"0": ["variables.input.avatar"],
		});

		const body = [
			`--${boundary}`,
			'Content-Disposition: form-data; name="operations"',
			"",
			operations,
			`--${boundary}`,
			'Content-Disposition: form-data; name="map"',
			"",
			map,
			`--${boundary}`,
			'Content-Disposition: form-data; name="0"; filename="avatar.png"',
			"Content-Type: image/png",
			"",
			"fake image content",
			`--${boundary}--`,
		].join("\r\n");

		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			headers: {
				"content-type": `multipart/form-data; boundary=${boundary}`,
				authorization: `bearer ${user.authToken}`,
			},
			payload: body,
		});

		const json = JSON.parse(response.body);

		expect(json.errors).toBeUndefined();
		expect(json.data.updateChat.id).toBe(chatId);
		expect(json.data.updateChat.avatarURL).toBeDefined();

		const [chat] = await server.drizzleClient
			.select()
			.from(chatsTable)
			.where(eq(chatsTable.id, chatId));

		expect(chat).toBeDefined();
		expect(chat?.avatarName).not.toBeNull();
		expect(chat?.avatarMimeType).toBe("image/png");
	});

	test("returns resource not found when chat does not exist", async () => {
		const result = await mercuriusClient.mutate(Mutation_updateChat, {
			headers: { authorization: `bearer ${sharedUser.authToken}` },
			variables: {
				input: {
					id: faker.string.uuid(),
					name: "New Name",
				},
			},
		});

		expect(result.data?.updateChat ?? null).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
					}),
				}),
			]),
		);
	});

	test("returns unauthorized when user is not chat or org admin", async () => {
		const outsider = await createRegularUserUsingAdmin();
		const orgId = await createTestOrganization();
		const chatId = faker.string.uuid();

		await server.drizzleClient.insert(chatsTable).values({
			id: chatId,
			name: "Chat",
			organizationId: orgId,
			creatorId: sharedUser.userId,
		});

		const result = await mercuriusClient.mutate(Mutation_updateChat, {
			headers: { authorization: `bearer ${outsider.authToken}` },
			variables: {
				input: {
					id: chatId,
					name: "Hack",
				},
			},
		});

		expect(result.data?.updateChat ?? null).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthorized_action_on_arguments_associated_resources",
					}),
				}),
			]),
		);
	});

	test("successfully updates chat when user is chat administrator", async () => {
		const creator = await createRegularUserUsingAdmin();
		const chatAdmin = await createRegularUserUsingAdmin();
		const orgId = await createTestOrganization();
		const chatId = faker.string.uuid();

		await server.drizzleClient.insert(chatsTable).values({
			id: chatId,
			name: "Old",
			organizationId: orgId,
			creatorId: creator.userId,
		});

		// 👇 REQUIRED: org membership (can be regular)
		await server.drizzleClient.insert(organizationMembershipsTable).values({
			memberId: chatAdmin.userId,
			organizationId: orgId,
			role: "regular",
		});

		// 👇 chat admin role
		await server.drizzleClient.insert(chatMembershipsTable).values({
			chatId,
			memberId: chatAdmin.userId,
			role: "administrator",
		});

		const result = await mercuriusClient.mutate(Mutation_updateChat, {
			headers: { authorization: `bearer ${chatAdmin.authToken}` },
			variables: {
				input: {
					id: chatId,
					name: "Updated by chat admin",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateChat?.id).toBe(chatId);
		expect(result.data?.updateChat?.name).toBe("Updated by chat admin");
	});

	test("successfully updates chat when user is organization administrator", async () => {
		const orgId = await createTestOrganization();
		const chatId = faker.string.uuid();

		await server.drizzleClient.insert(chatsTable).values({
			id: chatId,
			name: "Old",
			organizationId: orgId,
			creatorId: sharedUser.userId,
		});

		await server.drizzleClient.insert(organizationMembershipsTable).values({
			memberId: sharedUser.userId,
			organizationId: orgId,
			role: "administrator",
		});

		const result = await mercuriusClient.mutate(Mutation_updateChat, {
			headers: { authorization: `bearer ${sharedUser.authToken}` },
			variables: {
				input: {
					id: chatId,
					name: "Updated",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateChat?.id).toBe(chatId);
		expect(result.data?.updateChat?.name).toBe("Updated");
	});

	test("successfully updates multiple fields at once", async () => {
		const user = await createRegularUserUsingAdmin();
		const orgId = await createTestOrganization();
		const chatId = faker.string.uuid();

		await server.drizzleClient.insert(chatsTable).values({
			id: chatId,
			name: "Old Name",
			description: "Old Description",
			organizationId: orgId,
			creatorId: user.userId,
		});

		await server.drizzleClient.insert(organizationMembershipsTable).values({
			memberId: user.userId,
			organizationId: orgId,
			role: "administrator",
		});

		const result = await mercuriusClient.mutate(Mutation_updateChat, {
			headers: { authorization: `bearer ${user.authToken}` },
			variables: {
				input: {
					id: chatId,
					name: "New Name",
					description: "New Description",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateChat?.id).toBe(chatId);
		expect(result.data?.updateChat?.name).toBe("New Name");
		expect(result.data?.updateChat?.description).toBe("New Description");
	});

	test("successfully updates chat when user is system administrator", async () => {
		const systemAdmin = await createRegularUserUsingAdmin();
		const orgId = await createTestOrganization();
		const chatId = faker.string.uuid();

		await server.drizzleClient
			.update(usersTable)
			.set({ role: "administrator" })
			.where(eq(usersTable.id, systemAdmin.userId));

		await server.drizzleClient.insert(chatsTable).values({
			id: chatId,
			name: "Old",
			organizationId: orgId,
			creatorId: systemAdmin.userId,
		});

		const result = await mercuriusClient.mutate(Mutation_updateChat, {
			headers: { authorization: `bearer ${systemAdmin.authToken}` },
			variables: {
				input: {
					id: chatId,
					description: "Updated by system admin",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateChat?.id).toBe(chatId);
		expect(result.data?.updateChat?.description).toBe(
			"Updated by system admin",
		);
	});

	test("removes avatar when avatar is set to null", async () => {
		const orgId = await createTestOrganization();
		const chatId = faker.string.uuid();

		await server.drizzleClient.insert(chatsTable).values({
			id: chatId,
			name: "Chat",
			organizationId: orgId,
			creatorId: sharedUser.userId,
			avatarName: "old-avatar",
			avatarMimeType: "image/png",
		});

		await server.drizzleClient.insert(organizationMembershipsTable).values({
			memberId: sharedUser.userId,
			organizationId: orgId,
			role: "administrator",
		});

		const result = await mercuriusClient.mutate(Mutation_updateChat, {
			headers: { authorization: `bearer ${sharedUser.authToken}` },
			variables: {
				input: {
					id: chatId,
					avatar: null,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateChat?.avatarURL).toBeNull();

		const rows = await server.drizzleClient
			.select()
			.from(chatsTable)
			.where(eq(chatsTable.id, chatId));

		expect(rows.length).toBe(1);
		expect(rows[0]?.avatarName).toBeNull();
		expect(rows[0]?.avatarMimeType).toBeNull();
	});

	test("returns error when transaction throws", async () => {
		const user = await createRegularUserUsingAdmin();
		const orgId = await createTestOrganization();
		const chatId = faker.string.uuid();

		await server.drizzleClient.insert(chatsTable).values({
			id: chatId,
			name: "Chat",
			organizationId: orgId,
			creatorId: user.userId,
		});

		await server.drizzleClient.insert(organizationMembershipsTable).values({
			memberId: user.userId,
			organizationId: orgId,
			role: "administrator",
		});

		vi.spyOn(server.drizzleClient, "transaction").mockImplementationOnce(
			async () => {
				throw new Error("boom");
			},
		);

		const result = await mercuriusClient.mutate(Mutation_updateChat, {
			headers: { authorization: `bearer ${user.authToken}` },
			variables: {
				input: {
					id: chatId,
					name: "Fail",
				},
			},
		});

		expect(result.errors).toBeDefined();
		const firstError = result.errors?.[0];
		expect(firstError).toBeDefined();
		expect(firstError?.extensions).toEqual(
			expect.objectContaining({
				code: "internal_server_error",
				httpStatus: 500,
				correlationId: expect.any(String),
			}),
		);

		vi.restoreAllMocks();
	});
});
