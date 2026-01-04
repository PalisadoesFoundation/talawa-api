import { faker } from "@faker-js/faker";
import { graphql } from "gql.tada";
import type { GraphQLObjectType, GraphQLResolveInfo } from "graphql";
import { assertToBeNonNullish } from "test/helpers";
import { afterEach, describe, expect, test, vi } from "vitest";
import { schemaManager } from "~/src/graphql/schemaManager";
import { createDataloaders } from "~/src/utilities/dataloaders";
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

const Query_chat_organization = graphql(`
    query Query_chat_organization($input: QueryChatInput!) {
        chat(input: $input) {
            organization {
                id
                name
                countryCode
            }
        }
    }
`);

const TEST_PASSWORD = "password123";

async function signinAdmin() {
	const adminSignIn = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});
	assertToBeNonNullish(adminSignIn.data?.signIn?.authenticationToken);
	return adminSignIn;
}

async function createCreator(adminToken: string) {
	const creator = await mercuriusClient.mutate(Mutation_createUser, {
		headers: { authorization: `bearer ${adminToken}` },
		variables: {
			input: {
				emailAddress: `${faker.string.uuid()}@test.com`,
				name: faker.person.fullName(),
				password: TEST_PASSWORD,
				role: "regular",
				isEmailAddressVerified: false,
			},
		},
	});

	return creator;
}

async function createOrgMutation(adminToken: string) {
	return mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${adminToken}` },
		variables: {
			input: { name: `org-${faker.string.uuid()}`, countryCode: "us" },
		},
	});
}

async function createChatMutation(creatorToken: string, orgId: string) {
	return mercuriusClient.mutate(Mutation_createChat, {
		headers: { authorization: `bearer ${creatorToken}` },
		variables: {
			input: { name: `chat-${faker.string.uuid()}`, organizationId: orgId },
		},
	});
}

describe("Chat.organization integration test", () => {
	const cleanupFns: Array<() => Promise<void>> = [];

	afterEach(async () => {
		for (const fn of [...cleanupFns].reverse()) {
			try {
				await fn();
			} catch (err) {
				console.warn("cleanup error:", err);
			}
		}
		cleanupFns.length = 0;
	});

	test("happy path: returns the organization the chat belongs to", async () => {
		const adminSignIn = await signinAdmin();
		const adminToken = adminSignIn.data?.signIn?.authenticationToken as string;

		const creatorRes = await createCreator(adminToken);
		assertToBeNonNullish(creatorRes.data?.createUser);
		const creator = creatorRes.data?.createUser;

		assertToBeNonNullish(creator.user);
		assertToBeNonNullish(creator.user?.id);

		const creatorId = creator.user.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: creatorId } },
			});
		});

		const orgRes = await createOrgMutation(adminToken);
		assertToBeNonNullish(orgRes.data?.createOrganization);
		const org = orgRes.data?.createOrganization;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: org.id } },
			});
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: creator.user.id,
					organizationId: org.id,
					role: "regular",
				},
			},
		});

		assertToBeNonNullish(creator.user?.emailAddress);
		const creatorSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: creator.user.emailAddress,
					password: TEST_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(creatorSignIn.data?.signIn?.authenticationToken);
		const creatorToken = creatorSignIn.data?.signIn
			?.authenticationToken as string;

		const chatRes = await createChatMutation(creatorToken, org.id);
		assertToBeNonNullish(chatRes.data?.createChat);
		const chat = chatRes.data?.createChat;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteChat, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: chat.id } },
			});
		});

		const organization = await mercuriusClient.query(Query_chat_organization, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { id: chat.id } },
		});
		expect(organization.errors).toBeUndefined();
		expect(organization.data.chat?.organization?.name).toBe(org.name);
		expect(organization.data.chat?.organization?.id).toBe(org.id);
		expect(organization.data.chat?.organization?.countryCode).toBe("us");
	});

	test("organization resolver throws unexpected error when organization not found", async () => {
		// First create the test setup
		const adminSignIn = await signinAdmin();
		const adminToken = adminSignIn.data?.signIn?.authenticationToken as string;

		const creatorRes = await createCreator(adminToken);
		assertToBeNonNullish(creatorRes.data?.createUser?.user);
		const creatorId = creatorRes.data.createUser.user.id;

		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: creatorId } },
			});
		});

		// Get the schema and organization field resolver
		const schema = await schemaManager.buildInitialSchema();
		const fields = (schema.getType("Chat") as GraphQLObjectType).getFields();
		if (!fields.organization)
			throw new Error("Chat.organization field not found");
		const organizationField = fields.organization;

		// Create parent with non-existent organizationId to simulate corruption
		const parent = {
			id: faker.string.uuid(),
			organizationId: faker.string.uuid(), // UUID that doesn't exist in DB
			creatorId: creatorId,
		};

		const mockLogError = vi.fn();
		const ctx = {
			currentClient: { isAuthenticated: true, user: { id: creatorId } },
			drizzleClient: server.drizzleClient,
			dataloaders: createDataloaders(server.drizzleClient),
			log: {
				...server.log,
				error: mockLogError,
			} as unknown as typeof server.log,
			envConfig: server.envConfig,
			jwt: server.jwt,
			minio: server.minio,
		};

		// Invoke resolver directly and expect error
		await expect(async () =>
			organizationField.resolve?.(
				parent,
				{},
				ctx,
				undefined as unknown as GraphQLResolveInfo,
			),
		).rejects.toMatchObject({
			extensions: expect.objectContaining({ code: "unexpected" }),
		});

		expect(mockLogError).toHaveBeenCalledWith(
			{
				chatId: parent.id,
				organizationId: parent.organizationId,
			},
			"DataLoader returned null for a chat's organization id that isn't null.",
		);
	});
});
