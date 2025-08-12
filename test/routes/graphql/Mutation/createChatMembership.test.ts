import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, expect, suite, test } from "vitest";
import { mercuriusClient } from "../../../graphql/types/client";
import {
	Mutation_createChat,
	Mutation_createChatMembership,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteChat,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Query_signIn,
} from "../../../graphql/types/documentNodes";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";

// Helper to get admin token
async function getAdminToken() {
	const signInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});
	const token = signInResult.data?.signIn?.authenticationToken;
	assertToBeNonNullish(token);
	return token;
}

async function createUser(adminToken: string) {
	const res = await mercuriusClient.mutate(Mutation_createUser, {
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
	assertToBeNonNullish(res.data?.createUser);
	assertToBeNonNullish(res.data.createUser.user?.id);
	assertToBeNonNullish(res.data.createUser.authenticationToken);
	return {
		userId: res.data.createUser.user?.id as string,
		authToken: res.data.createUser.authenticationToken as string,
	};
}

// Helper to create organization
async function createOrganization(adminToken: string) {
	const res = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${adminToken}` },
		variables: {
			input: {
				name: `Org ${faker.string.uuid()}`,
				countryCode: "us",
			},
		},
	});
	assertToBeNonNullish(res.data?.createOrganization);
	return res.data.createOrganization.id as string;
}

// Helper to add org membership
async function addOrgMember(
	adminToken: string,
	memberId: string,
	organizationId: string,
	role: "regular" | "administrator" = "regular",
) {
	const res = await mercuriusClient.mutate(
		Mutation_createOrganizationMembership,
		{
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { memberId, organizationId, role } },
		},
	);
	assertToBeNonNullish(res.data?.createOrganizationMembership);
	return res.data.createOrganizationMembership.id as string;
}

// Helper to create chat
async function createChat(adminToken: string, organizationId: string) {
	const res = await mercuriusClient.mutate(Mutation_createChat, {
		headers: { authorization: `bearer ${adminToken}` },
		variables: {
			input: { name: `Chat ${faker.string.uuid()}`, organizationId },
		},
	});
	assertToBeNonNullish(res.data?.createChat);
	return res.data.createChat.id as string;
}

suite("Mutation field createChatMembership (integration)", () => {
	let adminToken: string;
	let orgId: string;
	let chatId: string;
	let user1Id: string;

	beforeAll(async () => {
		adminToken = await getAdminToken();
		const user = await createUser(adminToken);
		user1Id = user.userId;

		orgId = await createOrganization(adminToken);
		await addOrgMember(adminToken, user1Id, orgId, "regular");

		chatId = await createChat(adminToken, orgId);
	});

	afterAll(async () => {
		try {
			await mercuriusClient.mutate(Mutation_deleteChat, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: chatId } },
			});
		} catch {}
		try {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: user1Id } },
			});
		} catch {}
		try {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: orgId } },
			});
		} catch {}
	});

	test("unauthenticated client returns unauthenticated error", async () => {
		const res = await mercuriusClient.mutate(Mutation_createChatMembership, {
			variables: { input: { chatId, memberId: user1Id } },
		});
		expect(res.data?.createChatMembership).toBeNull();
		expect(res.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					path: ["createChatMembership"],
					extensions: expect.objectContaining({ code: "unauthenticated" }),
				}),
			]),
		);
	});

	test("admin adds member to chat", async () => {
		const res = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { chatId, memberId: user1Id } },
		});
		expect(res.errors).toBeUndefined();
		assertToBeNonNullish(res.data?.createChatMembership);
		// Assert the chat membership id is present
		expect(res.data.createChatMembership.id).toBeDefined();
	});

	test("invalid UUIDs -> invalid_arguments", async () => {
		const res = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { chatId: "not-a-uuid", memberId: "also-bad" } },
		});
		expect(res.data?.createChatMembership).toBeNull();
		expect(res.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					path: ["createChatMembership"],
					extensions: expect.objectContaining({ code: "invalid_arguments" }),
				}),
			]),
		);
	});

	test("non-admin setting role -> unauthorized_arguments", async () => {
		// Create a fresh regular user and add them to the org
		const newUser = await createUser(adminToken);
		try {
			await addOrgMember(adminToken, newUser.userId, orgId, "regular");

			// The new regular user attempts to set role while adding themselves to the chat
			const res = await mercuriusClient.mutate(Mutation_createChatMembership, {
				headers: { authorization: `bearer ${newUser.authToken}` },
				variables: {
					input: { chatId, memberId: newUser.userId, role: "administrator" },
				},
			});
			expect(res.data?.createChatMembership).toBeNull();
			expect(res.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						path: ["createChatMembership"],
						extensions: expect.objectContaining({
							code: "unauthorized_arguments",
						}),
					}),
				]),
			);
		} finally {
			// Cleanup the ephemeral user created for this test
			try {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { id: newUser.userId } },
				});
			} catch {}
		}
	});

	test("duplicate membership -> forbidden_action_on_arguments_associated_resources", async () => {
		// First add via admin (should succeed if not already added by happy path)
		const first = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { chatId, memberId: user1Id } },
		});
		// Ignore errors if already added in happy path
		if (!first.data?.createChatMembership) {
			expect(first.errors).toBeDefined();
		}

		// Try adding again -> should error
		const res = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { chatId, memberId: user1Id } },
		});
		expect(res.data?.createChatMembership).toBeNull();
		expect(res.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					path: ["createChatMembership"],
					extensions: expect.objectContaining({
						code: "forbidden_action_on_arguments_associated_resources",
					}),
				}),
			]),
		);
	});

	test("both chatId and memberId not found -> arguments_associated_resources_not_found", async () => {
		const res = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					chatId: faker.string.uuid(),
					memberId: faker.string.uuid(),
				},
			},
		});
		expect(res.data?.createChatMembership).toBeNull();
		expect(res.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					path: ["createChatMembership"],
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "memberId"],
							}),
							expect.objectContaining({ argumentPath: ["input", "chatId"] }),
						]),
					}),
				}),
			]),
		);
	});

	test("chatId not found -> arguments_associated_resources_not_found", async () => {
		const res = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					chatId: faker.string.uuid(),
					memberId: user1Id, // existing user
				},
			},
		});
		expect(res.data?.createChatMembership).toBeNull();
		expect(res.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					path: ["createChatMembership"],
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({ argumentPath: ["input", "chatId"] }),
						]),
					}),
				}),
			]),
		);
	});

	test("memberId not found -> arguments_associated_resources_not_found", async () => {
		const res = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					chatId, // existing chat
					memberId: faker.string.uuid(),
				},
			},
		});
		expect(res.data?.createChatMembership).toBeNull();
		expect(res.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					path: ["createChatMembership"],
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "memberId"],
							}),
						]),
					}),
				}),
			]),
		);
	});
});
