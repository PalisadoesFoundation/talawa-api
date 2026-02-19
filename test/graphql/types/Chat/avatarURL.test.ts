import { faker } from "@faker-js/faker";
import type { GraphQLObjectType } from "graphql";
import { afterAll, beforeAll, expect, suite, test } from "vitest";
import { schemaManager } from "~/src/graphql/schemaManager";
import envConfig from "~/src/utilities/graphqLimits";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createChat,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteChat,
	Mutation_deleteOrganization,
	Query_currentUser,
} from "../documentNodes";

const Query_chat_with_avatarURL = `
	query Query_chat_with_avatarURL($input: QueryChatInput!) {
		chat(input: $input) {
			id
			name
			avatarURL
		}
	}
`;

async function getAdminToken() {
	const { accessToken: authToken } = await getAdminAuthViaRest(server);
	const currentUserResult = await mercuriusClient.query(Query_currentUser, {
		headers: { authorization: `bearer ${authToken}` },
	});
	const userId = currentUserResult.data?.currentUser?.id;
	assertToBeNonNullish(authToken);
	assertToBeNonNullish(userId);
	return { authToken, userId };
}

async function createTestOrganization(adminAuthToken: string) {
	const orgResult = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: {
			authorization: `Bearer ${adminAuthToken}`,
		},
		variables: {
			input: {
				name: `Test Organization ${faker.string.uuid()}`,
				countryCode: "us",
			},
		},
	});

	assertToBeNonNullish(orgResult.data?.createOrganization);
	return orgResult.data.createOrganization.id;
}

async function createOrganizationMembership(
	adminAuthToken: string,
	memberId: string,
	organizationId: string,
	role: "regular" | "administrator" = "regular",
) {
	const membershipResult = await mercuriusClient.mutate(
		Mutation_createOrganizationMembership,
		{
			headers: {
				authorization: `Bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					memberId,
					organizationId,
					role,
				},
			},
		},
	);

	assertToBeNonNullish(membershipResult.data?.createOrganizationMembership);
	return membershipResult.data.createOrganizationMembership.id;
}

async function createTestChat(adminAuthToken: string, organizationId: string) {
	const chatResult = await mercuriusClient.mutate(Mutation_createChat, {
		headers: {
			authorization: `Bearer ${adminAuthToken}`,
		},
		variables: {
			input: {
				name: `Test Chat ${faker.string.uuid()}`,
				organizationId,
			},
		},
	});

	assertToBeNonNullish(chatResult.data?.createChat);
	return chatResult.data.createChat.id;
}

suite("Chat field avatarURL", () => {
	let adminAuthToken: string;
	let adminUserId: string;
	let organizationId: string;
	let testChatId: string;
	let avatarURLResolver!: NonNullable<
		NonNullable<
			ReturnType<GraphQLObjectType["getFields"]>["avatarURL"]
		>["resolve"]
	>;

	beforeAll(async () => {
		const admin = await getAdminToken();
		adminAuthToken = admin.authToken;
		adminUserId = admin.userId;

		organizationId = await createTestOrganization(adminAuthToken);

		await createOrganizationMembership(
			adminAuthToken,
			adminUserId,
			organizationId,
			"administrator",
		);

		testChatId = await createTestChat(adminAuthToken, organizationId);

		const schema = await schemaManager.buildInitialSchema();
		const chatType = schema.getType("Chat") as GraphQLObjectType;
		const avatarURLField = chatType.getFields().avatarURL;
		assertToBeNonNullish(avatarURLField);
		assertToBeNonNullish(avatarURLField.resolve);
		avatarURLResolver = avatarURLField.resolve;
	});

	afterAll(async () => {
		try {
			await mercuriusClient.mutate(Mutation_deleteChat, {
				headers: { authorization: `Bearer ${adminAuthToken}` },
				variables: { input: { id: testChatId } },
			});
		} catch (_error) {
			console.error(_error);
		}

		try {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `Bearer ${adminAuthToken}` },
				variables: { input: { id: organizationId } },
			});
		} catch (_error) {
			console.error(_error);
		}
	});

	function createTestContext() {
		return {
			currentClient: { isAuthenticated: true, user: { id: adminUserId } },
			drizzleClient: server.drizzleClient,
			log: server.log,
			envConfig: server.envConfig,
			jwt: server.jwt,
			minio: server.minio,
		};
	}

	test("returns null when avatarName is null", async () => {
		const result = await mercuriusClient.query(Query_chat_with_avatarURL, {
			headers: {
				authorization: `Bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					id: testChatId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.chat).not.toBeNull();
		expect(result.data?.chat?.id).toBe(testChatId);
		expect(result.data?.chat?.avatarURL).toBeNull();
	});

	test("constructs proper URL when avatarName is non-null (direct resolver invocation)", async () => {
		const testAvatarName = "test-avatar-image.png";
		const parent = {
			id: testChatId,
			organizationId,
			avatarName: testAvatarName,
		};

		const result = await avatarURLResolver(
			parent,
			{},
			createTestContext(),
			{} as never,
		);

		expect(result).toBe(
			new URL(
				`/objects/${testAvatarName}`,
				server.envConfig.API_BASE_URL,
			).toString(),
		);

		expect(() => new URL(result as string)).not.toThrow();

		expect(result).toContain(testAvatarName);
	});

	test("returns null when avatarName is null (direct resolver invocation)", async () => {
		const parent = {
			id: testChatId,
			organizationId,
			avatarName: null,
		};

		const result = await avatarURLResolver(
			parent,
			{},
			createTestContext(),
			{} as never,
		);

		expect(result).toBeNull();
	});

	test("has correct complexity value", async () => {
		const schema = await schemaManager.buildInitialSchema();

		const chatType = schema.getType("Chat") as GraphQLObjectType;
		const fields = chatType.getFields();
		expect(fields.avatarURL).toBeDefined();

		const avatarURLField = fields.avatarURL;
		assertToBeNonNullish(avatarURLField);

		expect(avatarURLField.extensions?.complexity).toBe(
			envConfig.API_GRAPHQL_SCALAR_FIELD_COST,
		);
	});

	test("URL construction uses correct base URL and path format", async () => {
		const testCases = [
			"avatar1.jpg",
			"subfolder/avatar2.png",
			"test-avatar-with-dashes.webp",
		];

		for (const avatarName of testCases) {
			const parent = {
				id: testChatId,
				organizationId,
				avatarName,
			};

			const result = await avatarURLResolver(
				parent,
				{},
				createTestContext(),
				{} as never,
			);

			expect(result).toBe(
				new URL(
					`/objects/${avatarName}`,
					server.envConfig.API_BASE_URL,
				).toString(),
			);
		}
	});
});
