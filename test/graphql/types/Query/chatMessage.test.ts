import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import {
	chatMembershipsTable,
	chatMessagesTable,
	chatsTable,
} from "~/src/drizzle/schema";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Query_chatMessage,
	Query_signIn,
} from "../documentNodes";

async function createTestOrganization(): Promise<string> {
	const signInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});

	expect(signInResult.errors ?? []).toEqual([]);

	const adminToken = signInResult.data?.signIn?.authenticationToken;
	expect(adminToken).toBeDefined();

	const createOrgResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: {
				authorization: `bearer ${adminToken}`,
			},
			variables: {
				input: {
					name: `TestOrg-${Date.now()}`,
					countryCode: "us",
					isUserRegistrationRequired: true,
				},
			},
		},
	);

	expect(createOrgResult.errors ?? []).toEqual([]);

	const orgId = createOrgResult.data?.createOrganization?.id;
	expect(orgId).toBeDefined();

	return orgId as string;
}

suite("chatMessage query", () => {
	test("returns unauthenticated errors when user is not logged in", async () => {
		const result = await mercuriusClient.query(Query_chatMessage, {
			variables: {
				input: {
					id: faker.string.uuid(),
				},
			},
		});

		expect(result.data?.chatMessage ?? null).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
					path: ["chatMessage"],
				}),
			]),
		);
	});
	test("return invalid_arguments for malformed id input", async () => {
		const { authToken } = await createRegularUserUsingAdmin();

		const result = await mercuriusClient.query(Query_chatMessage, {
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				input: {
					id: "",
				},
			},
		});

		expect(result.data?.chatMessage ?? null).toBeNull();
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
	test("returns resource not found error when chatMessage does not exist", async () => {
		const { authToken } = await createRegularUserUsingAdmin();

		const result = await mercuriusClient.query(Query_chatMessage, {
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				input: {
					id: faker.string.uuid(),
				},
			},
		});

		expect(result.data?.chatMessage ?? null).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
					}),
					path: ["chatMessage"],
				}),
			]),
		);
	});
	test("returns unauthorized error when user is not  a chat or organization admin", async () => {
		const creator = await createRegularUserUsingAdmin();
		const outsider = await createRegularUserUsingAdmin();

		const orgId = await createTestOrganization();
		const chatId = faker.string.uuid();
		const messageId = faker.string.uuid();

		await server.drizzleClient.insert(chatsTable).values({
			id: chatId,
			organizationId: orgId,
			name: "Test Chat",
			creatorId: creator.userId,
		});

		await server.drizzleClient.insert(chatMembershipsTable).values({
			chatId,
			memberId: creator.userId,
			role: "regular",
		});

		await server.drizzleClient.insert(chatMessagesTable).values({
			id: messageId,
			body: "Hello Message",
			chatId,
			creatorId: creator.userId,
		});

		const result = await mercuriusClient.query(Query_chatMessage, {
			headers: {
				authorization: `bearer ${outsider.authToken}`,
			},
			variables: {
				input: {
					id: messageId,
				},
			},
		});

		expect(result.data?.chatMessage ?? null).toBeNull();
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
	test("returns chat message when user is an organization administrator", async () => {
		const creator = await createRegularUserUsingAdmin();
		const adminUser = await createRegularUserUsingAdmin();

		const orgId = await createTestOrganization();
		const chatId = faker.string.uuid();
		const messageId = faker.string.uuid();

		await server.drizzleClient.insert(chatsTable).values({
			id: chatId,
			organizationId: orgId,
			name: "Test Chat",
			creatorId: creator.userId,
		});

		await server.drizzleClient.insert(chatMembershipsTable).values({
			chatId,
			memberId: creator.userId,
			role: "regular",
		});

		await server.drizzleClient.insert(chatMessagesTable).values({
			id: messageId,
			body: "Hello admin access",
			chatId,
			creatorId: creator.userId,
		});

		await server.drizzleClient.insert(organizationMembershipsTable).values({
			memberId: adminUser.userId,
			organizationId: orgId,
			role: "administrator",
		});

		const result = await mercuriusClient.query(Query_chatMessage, {
			headers: {
				authorization: `bearer ${adminUser.authToken}`,
			},
			variables: {
				input: {
					id: messageId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.chatMessage?.id).toBe(messageId);
	});
	test("returns chat message when user is a chat administrator", async () => {
		const creator = await createRegularUserUsingAdmin();
		const chatAdmin = await createRegularUserUsingAdmin();

		const orgId = await createTestOrganization();
		const chatId = faker.string.uuid();
		const messageId = faker.string.uuid();

		await server.drizzleClient.insert(chatsTable).values({
			id: chatId,
			organizationId: orgId,
			name: "Test Chat",
			creatorId: creator.userId,
		});

		await server.drizzleClient.insert(chatMembershipsTable).values({
			chatId,
			memberId: creator.userId,
			role: "regular",
		});

		await server.drizzleClient.insert(chatMessagesTable).values({
			id: messageId,
			body: "Hello chat admin access",
			chatId,
			creatorId: creator.userId,
		});

		await server.drizzleClient.insert(organizationMembershipsTable).values({
			memberId: chatAdmin.userId,
			organizationId: orgId,
			role: "regular",
		});

		await server.drizzleClient.insert(chatMembershipsTable).values({
			chatId,
			memberId: chatAdmin.userId,
			role: "administrator",
		});

		const result = await mercuriusClient.query(Query_chatMessage, {
			headers: {
				authorization: `bearer ${chatAdmin.authToken}`,
			},
			variables: {
				input: {
					id: messageId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.chatMessage?.id).toBe(messageId);
	});
});
