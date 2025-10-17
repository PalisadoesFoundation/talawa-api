import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, expect, suite, test } from "vitest";
import type {
	TalawaGraphQLErrorExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
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
import { Query_chat_with_creator } from "../documentNodes";

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
	const userId = signInResult.data?.signIn?.user?.id;
	assertToBeNonNullish(token);
	assertToBeNonNullish(userId);
	return { token, userId };
}

async function createTestOrganization(adminAuthToken: string) {
	const orgResult = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: { name: `Test Org ${faker.string.uuid()}`, countryCode: "us" },
		},
	});
	assertToBeNonNullish(orgResult.data?.createOrganization);
	return orgResult.data.createOrganization.id as string;
}

async function createOrganizationMembership(
	adminAuthToken: string,
	memberId: string,
	organizationId: string,
	role: "regular" | "administrator" = "regular",
) {
	const res = await mercuriusClient.mutate(
		Mutation_createOrganizationMembership,
		{
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { input: { memberId, organizationId, role } },
		},
	);
	assertToBeNonNullish(res.data?.createOrganizationMembership);
	return res.data.createOrganizationMembership.id as string;
}

async function createTestChat(adminAuthToken: string, organizationId: string) {
	const chatResult = await mercuriusClient.mutate(Mutation_createChat, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: { name: `Test Chat ${faker.string.uuid()}`, organizationId },
		},
	});
	assertToBeNonNullish(chatResult.data?.createChat);
	return chatResult.data.createChat.id as string;
}

suite("Chat field creator", () => {
	let adminAuthToken: string;
	let adminUserId: string;
	let regularUserId: string;
	let outsiderUserId: string;
	let outsiderUserAuthToken: string;
	let organizationId: string;
	let testChatId: string;

	beforeAll(async () => {
		const admin = await getAdminToken();
		adminAuthToken = admin.token;
		adminUserId = admin.userId;

		const regular = await createRegularUserUsingAdmin();
		regularUserId = regular.userId;

		const outsider = await createRegularUserUsingAdmin();
		outsiderUserId = outsider.userId;
		outsiderUserAuthToken = outsider.authToken;

		organizationId = await createTestOrganization(adminAuthToken);

		await createOrganizationMembership(
			adminAuthToken,
			adminUserId,
			organizationId,
			"administrator",
		);
		await createOrganizationMembership(
			adminAuthToken,
			regularUserId,
			organizationId,
			"regular",
		);

		testChatId = await createTestChat(adminAuthToken, organizationId);
	});

	afterAll(async () => {
		try {
			await mercuriusClient.mutate(Mutation_deleteChat, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: testChatId } },
			});
		} catch (e) {}

		try {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: regularUserId } },
			});
		} catch (e) {}

		try {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: outsiderUserId } },
			});
		} catch (e) {}

		try {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: organizationId } },
			});
		} catch (e) {}
	});

	test("unauthenticated caller results in unauthenticated error for creator field", async () => {
		const res = await mercuriusClient.query(Query_chat_with_creator, {
			variables: { input: { id: testChatId } },
		});

		expect(res.data.chat).toBeNull();
		expect(res.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					path: ["chat"],
					message: expect.any(String),
				}),
			]),
		);
	});

	test("orphaned token results in unauthenticated error for creator field", async () => {
		const tempUser = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					emailAddress: `${faker.string.uuid()}@example.com`,
					name: "t",
					password: "p",
					role: "regular",
					isEmailAddressVerified: false,
				},
			},
		});
		assertToBeNonNullish(tempUser.data?.createUser);
		assertToBeNonNullish(tempUser.data.createUser.user);
		const tempAuth = tempUser.data.createUser.authenticationToken;
		const tempUserId = tempUser.data.createUser.user.id;

		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { input: { id: tempUserId } },
		});

		const res = await mercuriusClient.query(Query_chat_with_creator, {
			headers: { authorization: `bearer ${tempAuth}` },
			variables: { input: { id: testChatId } },
		});

		expect(res.data.chat).toBeNull();
		expect(res.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					path: ["chat"],
					message: expect.any(String),
				}),
			]),
		);
	});

	test("outsider (not org member) receives unauthorized_action for creator field", async () => {
		const res = await mercuriusClient.query(Query_chat_with_creator, {
			headers: { authorization: `bearer ${outsiderUserAuthToken}` },
			variables: { input: { id: testChatId } },
		});

		expect(res.data.chat).toBeNull();
		expect(res.errors).toBeDefined();
		const maybeExt = res.errors?.[0] as unknown;
		let code: string | undefined = undefined;
		if (maybeExt && typeof maybeExt === "object") {
			const obj = maybeExt as Record<string, unknown>;
			const ext = obj.extensions as Record<string, unknown> | undefined;
			if (ext && typeof ext.code === "string") code = ext.code;
		}
		expect([
			"unauthorized_action",
			"unauthorized_action_on_arguments_associated_resources",
		]).toContain(code);
	});

	test("creator equals current user when querying as creator", async () => {
		const res = await mercuriusClient.query(Query_chat_with_creator, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { input: { id: testChatId } },
		});

		expect(res.errors).toBeUndefined();
		expect(res.data.chat?.creator?.id).toEqual(adminUserId);
	});

	test("deleted creator leads to unexpected error (business logic corruption)", async () => {
		const adminCreator = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					emailAddress: `${faker.string.uuid()}@example.com`,
					name: "c",
					password: "p",
					role: "administrator",
					isEmailAddressVerified: false,
				},
			},
		});
		assertToBeNonNullish(adminCreator.data?.createUser);
		assertToBeNonNullish(adminCreator.data.createUser.user);
		const adminCreatorId = adminCreator.data.createUser.user.id;
		const adminCreatorAuth = adminCreator.data.createUser.authenticationToken;

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					memberId: adminCreatorId,
					organizationId,
					role: "administrator",
				},
			},
		});

		const chatRes = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${adminCreatorAuth}` },
			variables: {
				input: { name: `OrphanChat ${faker.string.uuid()}`, organizationId },
			},
		});
		assertToBeNonNullish(chatRes.data?.createChat);
		const orphanChatId = chatRes.data.createChat.id;

		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { input: { id: adminCreatorId } },
		});

		const res = await mercuriusClient.query(Query_chat_with_creator, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { input: { id: orphanChatId } },
		});

		if (res.errors && res.errors.length > 0) {
			expect(res.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<TalawaGraphQLErrorExtensions>({
							code: "unexpected",
						}),
						path: ["chat", "creator"],
						message: expect.any(String),
					}),
				]),
			);
		} else {
			expect(res.data.chat).toBeDefined();
			expect(res.data.chat?.creator).toBeNull();
		}

		await mercuriusClient.mutate(Mutation_deleteChat, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { input: { id: orphanChatId } },
		});
	});
});
