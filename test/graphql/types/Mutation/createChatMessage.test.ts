import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, expect, suite, test } from "vitest";
import type { TalawaGraphQLFormattedError } from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createChat,
	Mutation_createChatMembership,
	Mutation_createChatMessage,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteChat,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Query_signIn,
} from "../documentNodes";

// Get administrator token and user id
async function getAdmin() {
	const result = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});

	assertToBeNonNullish(result.data?.signIn?.authenticationToken);
	assertToBeNonNullish(result.data?.signIn?.user?.id);

	return {
		token: result.data.signIn.authenticationToken,
		id: result.data.signIn.user.id,
	};
}

// Create a regular test user
async function createUser(adminToken: string) {
	const result = await mercuriusClient.mutate(Mutation_createUser, {
		headers: { authorization: `bearer ${adminToken}` },
		variables: {
			input: {
				emailAddress: `${faker.string.uuid()}@test.com`,
				name: faker.person.fullName(),
				password: "password123",
				role: "regular",
				isEmailAddressVerified: true,
			},
		},
	});

	assertToBeNonNullish(result.data?.createUser?.user?.id);
	assertToBeNonNullish(result.data?.createUser?.authenticationToken);

	return {
		id: result.data.createUser.user.id,
		token: result.data.createUser.authenticationToken,
	};
}

// Tests for createChatMessage mutation
suite("Mutation.createChatMessage", () => {
	let adminToken: string;
	let adminId: string;
	let userToken: string;
	let userId: string;
	let organizationId: string;
	let chatId: string;

	const createdUsers: string[] = [];
	const createdChats: string[] = [];
	const createdOrganizations: string[] = [];

	beforeAll(async () => {
		// Sign in as admin
		const admin = await getAdmin();
		adminToken = admin.token;
		adminId = admin.id;

		// Create a regular user
		const user = await createUser(adminToken);
		userId = user.id;
		userToken = user.token;
		createdUsers.push(userId);

		// Create organization
		const org = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					name: `Test Org ${faker.string.uuid()}`,
					countryCode: "us",
				},
			},
		});

		assertToBeNonNullish(org.data?.createOrganization?.id);
		organizationId = org.data.createOrganization.id;
		createdOrganizations.push(organizationId);

		// Add admin to organization
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: adminId,
					organizationId,
					role: "administrator",
				},
			},
		});

		// Add user to organization
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: userId,
					organizationId,
					role: "regular",
				},
			},
		});

		// Create chat
		const chat = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					name: "Test Chat",
					organizationId,
				},
			},
		});

		assertToBeNonNullish(chat.data?.createChat?.id);
		chatId = chat.data.createChat.id;
		createdChats.push(chatId);

		// Add user as chat member
		await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					chatId,
					memberId: userId,
				},
			},
		});
	});

	afterAll(async () => {
		// Delete created chats
		for (const chat of createdChats) {
			try {
				await mercuriusClient.mutate(Mutation_deleteChat, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { id: chat } },
				});
			} catch {}
		}

		// Delete created users
		for (const user of createdUsers) {
			try {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { id: user } },
				});
			} catch {}
		}

		// Delete created organizations
		for (const org of createdOrganizations) {
			try {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { id: org } },
				});
			} catch {}
		}
	});

	test("unauthenticated user cannot create a chat message", async () => {
		const result = await mercuriusClient.mutate(Mutation_createChatMessage, {
			variables: {
				input: {
					body: "Hello",
					chatId,
				},
			},
		});

		expect(result.data?.createChatMessage).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining({
					extensions: { code: "unauthenticated" },
					path: ["createChatMessage"],
				}),
			]),
		);
	});

	test("regular chat member can create a chat message", async () => {
		const result = await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${userToken}` },
			variables: {
				input: {
					body: "Hello world",
					chatId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.createChatMessage?.body).toBe("Hello world");
	});

	test("reply message can be created using a valid parentMessageId", async () => {
		// Create parent message
		const parent = await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${userToken}` },
			variables: {
				input: {
					body: "Parent message",
					chatId,
				},
			},
		});

		const parentId = parent.data?.createChatMessage?.id;
		assertToBeNonNullish(parentId);

		// Create reply message
		const result = await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${userToken}` },
			variables: {
				input: {
					body: "Reply message",
					chatId,
					parentMessageId: parentId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.createChatMessage?.parentMessage?.id).toBe(parentId);
	});
});
