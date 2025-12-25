import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createChat,
	Mutation_createOrganization,
	Mutation_joinPublicOrganization,
	Query_signIn,
} from "../documentNodes";

let orgId: string | undefined;

//sign in once
const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});

assertToBeNonNullish(signInResult.data?.signIn);
const authToken = signInResult.data.signIn.authenticationToken;
assertToBeNonNullish(authToken);

const OrganizationChatsQuery = `
  query OrganizationChats(
    $input: QueryOrganizationInput!
    $first: Int
    $after: String
    $last: Int
    $before: String
  ) {
    organization(input: $input) {
      id
      chats(first: $first, after: $after, last: $last, before: $before) {
        edges {
          cursor
          node {
            id
            name
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
        }
      }
    }
  }
`;

suite("Organization field chats", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const createOrg = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							description: "Unauth chats test",
							countryCode: "us",
							state: "CA",
							city: "SF",
							postalCode: "94101",
							addressLine1: "123 Test St",
						},
					},
				},
			);

			const orgId = createOrg.data?.createOrganization?.id;
			expect(orgId).toBeDefined();

			const result = await mercuriusClient.query(OrganizationChatsQuery, {
				variables: {
					input: { id: orgId },
					first: 2,
				},
			});

			expect(result.data?.organization?.chats ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["organization", "chats"],
					}),
				]),
			);
		});
	});

	suite("when arguments are invalid (cursor parse error)", () => {
		test("should return an error with invalid_arguments extensions code", async () => {
			const createOrg = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							description: "Chats invalid cursor test",
							countryCode: "us",
							state: "CA",
							city: "SF",
							postalCode: "94101",
							addressLine1: "123 Test St",
						},
					},
				},
			);

			const orgId = createOrg.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const result = await mercuriusClient.query(OrganizationChatsQuery, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: { id: orgId },
					first: 2,
					after: "not-a-valid-base64",
				},
			});

			expect(result.data?.organization?.chats ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["after"],
								}),
							]),
						}),
						path: ["organization", "chats"],
					}),
				]),
			);
		});
	});

	suite("when the cursor references a non-existing resource", () => {
		test("should return arguments_associated_resources_not_found error", async () => {
			const createOrg = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							description: "Cursor not found test",
							countryCode: "us",
							state: "CA",
							city: "LA",
							postalCode: "90001",
							addressLine1: "456 Main St",
						},
					},
				},
			);

			const orgId = createOrg.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const fakeCursor = Buffer.from(
				JSON.stringify({
					id: faker.string.uuid(),
					name: "ghost-chat",
				}),
			).toString("base64url");

			const result = await mercuriusClient.query(OrganizationChatsQuery, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: { id: orgId },
					first: 2,
					after: fakeCursor,
				},
			});

			expect(result.data?.organization?.chats ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["organization", "chats"],
					}),
				]),
			);
		});
	});

	suite("when the client is authorized", () => {
		test("should return chats successfully (forward pagination)", async () => {
			const createOrg = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							description: "Chats success test",
							countryCode: "us",
							state: "CA",
							city: "SF",
							postalCode: "94101",
							addressLine1: "789 Market St",
						},
					},
				},
			);

			orgId = createOrg.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			await mercuriusClient.mutate(Mutation_joinPublicOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: { organizationId: orgId },
				},
			});

			//create chats ONCE (no duplicates)
			for (let i = 0; i < 3; i++) {
				await mercuriusClient.mutate(Mutation_createChat, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							organizationId: orgId,
							name: `chat-${String(i).padStart(2, "0")}`,
						},
					},
				});
			}

			const result = await mercuriusClient.query(OrganizationChatsQuery, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: { id: orgId },
					first: 2,
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data.organization.chats.edges.length).toBe(2);
		});

		test("should support cursor-based pagination", async () => {
			// ✅ REQUIRED safety guard
			assertToBeNonNullish(orgId);

			const initialResult = await mercuriusClient.query(
				OrganizationChatsQuery,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: { id: orgId },
						first: 10,
					},
				},
			);

			expect(initialResult.errors).toBeUndefined();

			const edges = initialResult.data.organization.chats.edges;
			expect(edges.length).toBeGreaterThan(1);

			const cursor = edges[0].cursor;
			expect(cursor).toBeDefined();

			const paginatedResult = await mercuriusClient.query(
				OrganizationChatsQuery,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: { id: orgId },
						first: 1,
						after: cursor,
					},
				},
			);

			expect(paginatedResult.errors).toBeUndefined();
			expect(
				paginatedResult.data.organization.chats.edges.length,
			).toBeGreaterThan(0);
		});
	});
});
