import { faker } from "@faker-js/faker";
import { beforeAll, expect, suite, test } from "vitest";
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createChat,
	Mutation_createChatMembership,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
} from "../documentNodes";

let authToken: string;

beforeAll(async () => {
	const { accessToken } = await getAdminAuthViaRest(server);
	assertToBeNonNullish(accessToken);
	authToken = accessToken;
});

// Helper function to create an organization
async function createOrganization(): Promise<string> {
	const uniqueName = `Test Org ${faker.string.uuid()}`;
	const result = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				name: uniqueName,
				countryCode: "us",
			},
		},
	});
	const orgId = result.data?.createOrganization?.id;
	assertToBeNonNullish(orgId);
	return orgId;
}

// Helper function to create a user
async function createUser(): Promise<{
	id: string;
	emailAddress: string;
}> {
	const email = `${faker.string.ulid()}@example.com`;
	const result = await mercuriusClient.mutate(Mutation_createUser, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				emailAddress: email,
				isEmailAddressVerified: true,
				name: faker.person.fullName(),
				password: "password123",
				role: "regular",
			},
		},
	});
	assertToBeNonNullish(result.data?.createUser);
	assertToBeNonNullish(result.data.createUser.user);
	const userId = result.data.createUser.user.id;
	assertToBeNonNullish(userId);
	return { id: userId, emailAddress: email };
}

// Helper function to get auth token for a user (REST sign-in)
async function getUserAuthToken(
	emailAddress: string,
	password: string,
): Promise<string> {
	const response = await server.inject({
		method: "POST",
		url: "/auth/signin",
		payload: { email: emailAddress, password },
	});
	const cookie = response.cookies.find(
		(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
	);
	assertToBeNonNullish(cookie?.value);
	return cookie.value;
}

suite("Mutation field createChatMembership", () => {
	test("unauthenticated error when client is not authenticated", async () => {
		const result = await mercuriusClient.mutate(Mutation_createChatMembership, {
			variables: {
				input: {
					chatId: faker.string.uuid(),
					memberId: faker.string.uuid(),
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unauthenticated" }),
			}),
		);
		expect(result.data).toEqual({ createChatMembership: null });
	});

	test("invalid_arguments error for invalid UUIDs", async () => {
		const result = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					chatId: "not-a-uuid",
					memberId: "also-not-a-uuid",
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "invalid_arguments" }),
			}),
		);
	});

	test("arguments_associated_resources_not_found when both chat and member do not exist", async () => {
		const nonExistentChatId = faker.string.uuid();
		const nonExistentMemberId = faker.string.uuid();

		const result = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					chatId: nonExistentChatId,
					memberId: nonExistentMemberId,
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "arguments_associated_resources_not_found",
				}),
			}),
		);
	});

	test("arguments_associated_resources_not_found when chat does not exist", async () => {
		// Create a user to use as member
		const member = await createUser();
		const nonExistentChatId = faker.string.uuid();

		const result = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					chatId: nonExistentChatId,
					memberId: member.id,
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "arguments_associated_resources_not_found",
				}),
			}),
		);
	});

	test("arguments_associated_resources_not_found when member does not exist", async () => {
		// Create organization, user, and chat
		const orgId = await createOrganization();
		const chatOwner = await createUser();
		const chatOwnerToken = await getUserAuthToken(
			chatOwner.emailAddress,
			"password123",
		);

		// Create organization membership for chat owner
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: chatOwner.id,
					role: "administrator",
				},
			},
		});

		// Create chat
		const chatResult = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${chatOwnerToken}` },
			variables: {
				input: {
					name: `Test Chat ${faker.string.uuid()}`,
					organizationId: orgId,
				},
			},
		});
		assertToBeNonNullish(chatResult.data?.createChat);
		const chatId = chatResult.data.createChat.id;

		const nonExistentMemberId = faker.string.uuid();

		const result = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${chatOwnerToken}` },
			variables: {
				input: {
					chatId: chatId,
					memberId: nonExistentMemberId,
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "arguments_associated_resources_not_found",
				}),
			}),
		);
	});

	test("forbidden_action_on_arguments_associated_resources when chat membership already exists", async () => {
		// Create organization
		const orgId = await createOrganization();

		// Create chat owner
		const chatOwner = await createUser();
		const chatOwnerToken = await getUserAuthToken(
			chatOwner.emailAddress,
			"password123",
		);

		// Create member to add
		const member = await createUser();

		// Create organization membership for chat owner
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: chatOwner.id,
					role: "administrator",
				},
			},
		});

		// Create chat
		const chatResult = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${chatOwnerToken}` },
			variables: {
				input: {
					name: `Test Chat ${faker.string.uuid()}`,
					organizationId: orgId,
				},
			},
		});
		assertToBeNonNullish(chatResult.data?.createChat);
		const chatId = chatResult.data.createChat.id;

		// Create first chat membership
		const firstMembership = await mercuriusClient.mutate(
			Mutation_createChatMembership,
			{
				headers: { authorization: `bearer ${chatOwnerToken}` },
				variables: {
					input: {
						chatId: chatId,
						memberId: member.id,
					},
				},
			},
		);
		assertToBeNonNullish(firstMembership.data?.createChatMembership);

		// Try to create duplicate chat membership
		const result = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${chatOwnerToken}` },
			variables: {
				input: {
					chatId: chatId,
					memberId: member.id,
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "forbidden_action_on_arguments_associated_resources",
				}),
			}),
		);
	});

	test("unauthorized_action_on_arguments_associated_resources when user is not admin, org member, or chat member", async () => {
		// Create organization
		const orgId = await createOrganization();

		// Create chat owner
		const chatOwner = await createUser();
		const chatOwnerToken = await getUserAuthToken(
			chatOwner.emailAddress,
			"password123",
		);

		// Create unauthorized user
		const unauthorizedUser = await createUser();
		const unauthorizedToken = await getUserAuthToken(
			unauthorizedUser.emailAddress,
			"password123",
		);

		// Create member to add
		const member = await createUser();

		// Create organization membership for chat owner
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: chatOwner.id,
					role: "administrator",
				},
			},
		});

		// Create chat
		const chatResult = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${chatOwnerToken}` },
			variables: {
				input: {
					name: `Test Chat ${faker.string.uuid()}`,
					organizationId: orgId,
				},
			},
		});
		assertToBeNonNullish(chatResult.data?.createChat);
		const chatId = chatResult.data.createChat.id;

		// Try to create chat membership as unauthorized user
		const result = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${unauthorizedToken}` },
			variables: {
				input: {
					chatId: chatId,
					memberId: member.id,
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action_on_arguments_associated_resources",
				}),
			}),
		);
	});

	test("unauthorized_action_on_arguments_associated_resources when chat member tries to set non-regular role", async () => {
		// Create organization
		const orgId = await createOrganization();

		// Create chat owner
		const chatOwner = await createUser();
		const chatOwnerToken = await getUserAuthToken(
			chatOwner.emailAddress,
			"password123",
		);

		// Create chat member (not org member)
		const chatMember = await createUser();
		const chatMemberToken = await getUserAuthToken(
			chatMember.emailAddress,
			"password123",
		);

		// Create member to add
		const newMember = await createUser();

		// Create organization membership for chat owner
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: chatOwner.id,
					role: "administrator",
				},
			},
		});

		// Create chat
		const chatResult = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${chatOwnerToken}` },
			variables: {
				input: {
					name: `Test Chat ${faker.string.uuid()}`,
					organizationId: orgId,
				},
			},
		});
		assertToBeNonNullish(chatResult.data?.createChat);
		const chatId = chatResult.data.createChat.id;

		// Add chatMember to chat (as regular member)
		const addMemberResult = await mercuriusClient.mutate(
			Mutation_createChatMembership,
			{
				headers: { authorization: `bearer ${chatOwnerToken}` },
				variables: {
					input: {
						chatId: chatId,
						memberId: chatMember.id,
						role: "regular",
					},
				},
			},
		);
		assertToBeNonNullish(addMemberResult.data?.createChatMembership);

		// Try to create chat membership with administrator role as chat member (not org member)
		const result = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${chatMemberToken}` },
			variables: {
				input: {
					chatId: chatId,
					memberId: newMember.id,
					role: "administrator",
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action_on_arguments_associated_resources",
				}),
			}),
		);
	});

	test("successfully creates chat membership as organization administrator", async () => {
		// Create organization
		const orgId = await createOrganization();

		// Create org admin
		const orgAdmin = await createUser();
		const orgAdminToken = await getUserAuthToken(
			orgAdmin.emailAddress,
			"password123",
		);

		// Create member to add
		const member = await createUser();

		// Create organization membership for org admin
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: orgAdmin.id,
					role: "administrator",
				},
			},
		});

		// Create chat
		const chatResult = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${orgAdminToken}` },
			variables: {
				input: {
					name: `Test Chat ${faker.string.uuid()}`,
					organizationId: orgId,
				},
			},
		});
		assertToBeNonNullish(chatResult.data?.createChat);
		const chatId = chatResult.data.createChat.id;

		// Create chat membership as org admin
		const result = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${orgAdminToken}` },
			variables: {
				input: {
					chatId: chatId,
					memberId: member.id,
					role: "regular",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.createChatMembership);
		expect(result.data.createChatMembership.id).toBe(chatId);

		// Verify membership was created in database
		const createdMembership =
			await server.drizzleClient.query.chatMembershipsTable.findFirst({
				where: (fields, operators) =>
					operators.and(
						operators.eq(fields.chatId, chatId),
						operators.eq(fields.memberId, member.id),
					),
			});
		assertToBeNonNullish(createdMembership);
		expect(createdMembership.role).toBe("regular");
	});

	test("successfully creates chat membership with default regular role when role not specified", async () => {
		// Create organization
		const orgId = await createOrganization();

		// Create org admin
		const orgAdmin = await createUser();
		const orgAdminToken = await getUserAuthToken(
			orgAdmin.emailAddress,
			"password123",
		);

		// Create member to add
		const member = await createUser();

		// Create organization membership for org admin
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: orgAdmin.id,
					role: "administrator",
				},
			},
		});

		// Create chat
		const chatResult = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${orgAdminToken}` },
			variables: {
				input: {
					name: `Test Chat ${faker.string.uuid()}`,
					organizationId: orgId,
				},
			},
		});
		assertToBeNonNullish(chatResult.data?.createChat);
		const chatId = chatResult.data.createChat.id;

		// Create chat membership without specifying role
		const result = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${orgAdminToken}` },
			variables: {
				input: {
					chatId: chatId,
					memberId: member.id,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.createChatMembership);

		// Verify membership was created with regular role
		const createdMembership =
			await server.drizzleClient.query.chatMembershipsTable.findFirst({
				where: (fields, operators) =>
					operators.and(
						operators.eq(fields.chatId, chatId),
						operators.eq(fields.memberId, member.id),
					),
			});
		assertToBeNonNullish(createdMembership);
		expect(createdMembership.role).toBe("regular");
	});

	test("successfully creates chat membership as global administrator with regular role", async () => {
		// Create organization
		const orgId = await createOrganization();

		// Create a regular user as chat owner
		const chatOwner = await createUser();
		const chatOwnerToken = await getUserAuthToken(
			chatOwner.emailAddress,
			"password123",
		);

		// Create member to add
		const member = await createUser();

		// Create organization membership for chat owner
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: chatOwner.id,
					role: "regular",
				},
			},
		});

		// Create chat
		const chatResult = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${chatOwnerToken}` },
			variables: {
				input: {
					name: `Test Chat ${faker.string.uuid()}`,
					organizationId: orgId,
				},
			},
		});
		assertToBeNonNullish(chatResult.data?.createChat);
		const chatId = chatResult.data.createChat.id;

		// Create chat membership as global admin (with regular role only since not org member)
		const result = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					chatId: chatId,
					memberId: member.id,
					role: "regular",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.createChatMembership);

		// Verify membership was created in database
		const createdMembership =
			await server.drizzleClient.query.chatMembershipsTable.findFirst({
				where: (fields, operators) =>
					operators.and(
						operators.eq(fields.chatId, chatId),
						operators.eq(fields.memberId, member.id),
					),
			});
		assertToBeNonNullish(createdMembership);
		expect(createdMembership.role).toBe("regular");
	});

	test("successfully creates chat membership as existing chat member with org membership", async () => {
		// Create organization
		const orgId = await createOrganization();

		// Create chat owner
		const chatOwner = await createUser();
		const chatOwnerToken = await getUserAuthToken(
			chatOwner.emailAddress,
			"password123",
		);

		// Create existing chat member who is also an org member
		const existingChatMember = await createUser();
		const existingMemberToken = await getUserAuthToken(
			existingChatMember.emailAddress,
			"password123",
		);

		// Create new member to add
		const newMember = await createUser();

		// Create organization membership for chat owner
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: chatOwner.id,
					role: "administrator",
				},
			},
		});

		// Create organization membership for existing chat member
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: existingChatMember.id,
					role: "regular",
				},
			},
		});

		// Create chat
		const chatResult = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${chatOwnerToken}` },
			variables: {
				input: {
					name: `Test Chat ${faker.string.uuid()}`,
					organizationId: orgId,
				},
			},
		});
		assertToBeNonNullish(chatResult.data?.createChat);
		const chatId = chatResult.data.createChat.id;

		// Add existing member to chat
		const addExistingMemberResult = await mercuriusClient.mutate(
			Mutation_createChatMembership,
			{
				headers: { authorization: `bearer ${chatOwnerToken}` },
				variables: {
					input: {
						chatId: chatId,
						memberId: existingChatMember.id,
						role: "regular",
					},
				},
			},
		);
		assertToBeNonNullish(addExistingMemberResult.data?.createChatMembership);

		// Create new chat membership as existing chat member (with regular role only)
		const result = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${existingMemberToken}` },
			variables: {
				input: {
					chatId: chatId,
					memberId: newMember.id,
					role: "regular",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.createChatMembership);

		// Verify membership was created in database
		const createdMembership =
			await server.drizzleClient.query.chatMembershipsTable.findFirst({
				where: (fields, operators) =>
					operators.and(
						operators.eq(fields.chatId, chatId),
						operators.eq(fields.memberId, newMember.id),
					),
			});
		assertToBeNonNullish(createdMembership);
		expect(createdMembership.role).toBe("regular");
	});
});
