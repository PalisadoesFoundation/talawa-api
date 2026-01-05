import { Readable } from "node:stream";
import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import gql from "graphql-tag";
import { expect, suite, test, vi } from "vitest";

import { chatMembershipsTable } from "~/src/drizzle/schema";
import { chatsTable } from "~/src/drizzle/tables/chats";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";

import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import { Mutation_createOrganization, Query_signIn } from "../documentNodes";

const Mutation_updateChat = gql(`
	mutation Mutation_updateChat($input: MutationUpdateChatInput!) {
		updateChat(input: $input) {
			id
			name
			description
			avatarURL
		}
	}
`);

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
	if (!token) {
		throw new Error("Admin token not returned");
	}

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
	if (!orgId) {
		throw new Error("Organization not created");
	}

	return orgId;
}

/* ---------------- Tests ---------------- */

suite("updateChat mutation", () => {
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
		const { authToken } = await createRegularUserUsingAdmin();

		const result = await mercuriusClient.mutate(Mutation_updateChat, {
			headers: { authorization: `bearer ${authToken}` },
			variables: { input: { id: "" } },
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

	test("returns invalid_arguments for invalid avatar mime type", async () => {
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

		const fakeUpload = Promise.resolve({
			filename: "evil.exe",
			mimetype: "application/x-msdownload",
			createReadStream: () => Readable.from("fake"),
		});

		const result = await mercuriusClient.mutate(Mutation_updateChat, {
			headers: { authorization: `bearer ${user.authToken}` },
			variables: {
				input: {
					id: chatId,
					avatar: fakeUpload,
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

	test("returns resource not found when chat does not exist", async () => {
		const { authToken } = await createRegularUserUsingAdmin();

		const result = await mercuriusClient.mutate(Mutation_updateChat, {
			headers: { authorization: `bearer ${authToken}` },
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
		const creator = await createRegularUserUsingAdmin();
		const outsider = await createRegularUserUsingAdmin();
		const orgId = await createTestOrganization();
		const chatId = faker.string.uuid();

		await server.drizzleClient.insert(chatsTable).values({
			id: chatId,
			name: "Chat",
			organizationId: orgId,
			creatorId: creator.userId,
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
		expect(result.data?.updateChat.name).toBe("Updated by chat admin");
	});

	test("successfully updates chat when user is organization administrator", async () => {
		const user = await createRegularUserUsingAdmin();
		const orgId = await createTestOrganization();
		const chatId = faker.string.uuid();

		await server.drizzleClient.insert(chatsTable).values({
			id: chatId,
			name: "Old",
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
					description: "Updated",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateChat.description).toBe("Updated");
	});

	test("removes avatar when avatar is set to null", async () => {
		const user = await createRegularUserUsingAdmin();
		const orgId = await createTestOrganization();
		const chatId = faker.string.uuid();

		await server.drizzleClient.insert(chatsTable).values({
			id: chatId,
			name: "Chat",
			organizationId: orgId,
			creatorId: user.userId,
			avatarName: "old-avatar",
			avatarMimeType: "image/png",
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
					avatar: null,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateChat.avatarURL).toBeNull();

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

		vi.spyOn(server.drizzleClient, "transaction").mockImplementationOnce(
			async () => {
				throw new Error("boom");
			},
		);

		const result = await mercuriusClient.mutate(Mutation_updateChat, {
			headers: { authorization: `bearer ${user.authToken}` },
			variables: {
				input: {
					id: faker.string.uuid(),
					name: "Fail",
				},
			},
		});

		expect(result.errors).toBeDefined();
		vi.restoreAllMocks();
	});
});
