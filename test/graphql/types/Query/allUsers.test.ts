import { faker } from "@faker-js/faker";
import { inArray } from "drizzle-orm";
import gql from "graphql-tag";
import { afterEach, expect, suite, test, vi } from "vitest";
import { usersTable } from "~/src/drizzle/tables/users";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import { Query_signIn } from "../documentNodes";

/* -------------------------------------------------- */
/* GraphQL Query */
/* -------------------------------------------------- */
const AllUsersQuery = gql`
  query AllUsers(
    $first: Int
    $after: String
    $last: Int
    $before: String
    $where: QueryAllUsersWhereInput
  ) {
    allUsers(
      first: $first
      after: $after
      last: $last
      before: $before
      where: $where
    ) {
      edges {
        cursor
        node {
          id
          name
          role
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

/* -------------------------------------------------- */
/* Types */
/* -------------------------------------------------- */
type AllUsersEdge = {
	cursor: string;
	node: {
		id: string;
		name: string;
		role: string;
	};
};

/* -------------------------------------------------- */
/* Helpers */
/* -------------------------------------------------- */
const createdUserIds: string[] = [];
async function getAdminAuthToken(): Promise<string> {
	const result = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});

	assertToBeNonNullish(result.data?.signIn?.authenticationToken);
	return result.data.signIn.authenticationToken;
}

async function createTestUser(
	overrides: {
		name?: string;
		role?: "regular" | "administrator";
		createdAt?: Date;
	} = {},
) {
	const uuid = faker.string.uuid();

	const [user] = await server.drizzleClient
		.insert(usersTable)
		.values({
			name: overrides.name ?? `TestUser_${uuid}`,
			emailAddress: `test_${uuid}@example.com`,
			isEmailAddressVerified: true,
			passwordHash: faker.string.alphanumeric(60),
			role: overrides.role ?? "regular",
			createdAt: overrides.createdAt ?? new Date(),
		})

		.returning();

	assertToBeNonNullish(user);
	createdUserIds.push(user.id);
	return user;
}

afterEach(async () => {
	vi.restoreAllMocks();

	if (createdUserIds.length > 0) {
		await server.drizzleClient
			.delete(usersTable)
			.where(inArray(usersTable.id, createdUserIds));

		createdUserIds.length = 0;
	}
});

/* -------------------------------------------------- */
/* Test Suite */
/* -------------------------------------------------- */
suite("Query field allUsers", () => {
	/* -------------------------------------------------- */
	/* Authentication & Authorization Tests */
	/* -------------------------------------------------- */

	/**
	 * Test 1: Unauthenticated Access
	 */
	test("returns unauthenticated if client is not authenticated", async () => {
		await createTestUser();

		const result = await mercuriusClient.query(AllUsersQuery, {
			variables: { first: 10 },
		});

		expect(result.data?.allUsers).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: {
						code: "unauthenticated",
						correlationId: expect.any(String),
						httpStatus: expect.any(Number),
					},
					path: ["allUsers"],
				}),
			]),
		);
	});

	/**
	 * Test 2: Current User Not Found
	 */
	test("returns unauthenticated if current user is not found", async () => {
		const token = await getAdminAuthToken();
		await createTestUser();

		vi.spyOn(
			server.drizzleClient.query.usersTable,
			"findFirst",
		).mockResolvedValueOnce(undefined);

		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { first: 10 },
		});

		expect(result.data?.allUsers).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: {
						code: "unauthenticated",
						correlationId: expect.any(String),
						httpStatus: expect.any(Number),
					},
					path: ["allUsers"],
				}),
			]),
		);
	});

	/**
	 * Test 3: Non-Administrator Access
	 */
	test("returns unauthorized_action for non-administrator user", async () => {
		await createTestUser();
		const { authToken } = await createRegularUserUsingAdmin();

		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { first: 10 },
		});

		expect(result.data?.allUsers).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: {
						code: "unauthorized_action",
						correlationId: expect.any(String),
						httpStatus: expect.any(Number),
					},
					path: ["allUsers"],
				}),
			]),
		);
	});

	/* -------------------------------------------------- */
	/* Argument Validation Tests */
	/* -------------------------------------------------- */

	/**
	 * Test 4: Invalid Cursor Format (Base64 Decode Error)
	 */
	test("returns invalid_arguments for invalid base64 cursor", async () => {
		const token = await getAdminAuthToken();

		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { first: 10, after: "!!!invalid-base64!!!" },
		});

		expect(result.data?.allUsers).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					path: ["allUsers"],
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["after"],
								message: "Not a valid cursor.",
							}),
						]),
					}),
				}),
			]),
		);
	});

	/**
	 * Test 5: Invalid JSON in Cursor
	 */
	test("returns invalid_arguments for cursor with invalid JSON", async () => {
		const token = await getAdminAuthToken();
		const invalidJsonCursor =
			Buffer.from("not-valid-json").toString("base64url");

		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { first: 10, after: invalidJsonCursor },
		});

		expect(result.data?.allUsers).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					path: ["allUsers"],
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["after"],
								message: "Not a valid cursor.",
							}),
						]),
					}),
				}),
			]),
		);
	});

	/**
	 * Test 6: Invalid Cursor Schema
	 */
	test("returns invalid_arguments for cursor with invalid schema", async () => {
		const token = await getAdminAuthToken();

		const invalidCursor = Buffer.from(
			JSON.stringify({
				createdAt: "not-a-valid-datetime",
				id: "not-a-uuid",
			}),
		).toString("base64url");

		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { first: 10, after: invalidCursor },
		});

		expect(result.data?.allUsers).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					path: ["allUsers"],
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["after"],
								message: "Not a valid cursor.",
							}),
						]),
					}),
				}),
			]),
		);
	});

	/**
	 * Test 6b: Invalid Cursor Schema for Backward Pagination
	 */
	test("returns invalid_arguments for invalid before cursor", async () => {
		const token = await getAdminAuthToken();

		const invalidCursor = Buffer.from(
			JSON.stringify({
				createdAt: "invalid-date",
				id: "invalid-uuid",
			}),
		).toString("base64url");

		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { last: 10, before: invalidCursor },
		});

		expect(result.data?.allUsers).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					path: ["allUsers"],
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["before"],
								message: "Not a valid cursor.",
							}),
						]),
					}),
				}),
			]),
		);
	});

	/**
	 * Test 7: Non-Existent Cursor
	 */
	test("returns arguments_associated_resources_not_found for non-existent cursor", async () => {
		const token = await getAdminAuthToken();

		const cursor = Buffer.from(
			JSON.stringify({
				id: faker.string.uuid(),
				createdAt: new Date().toISOString(),
			}),
		).toString("base64url");

		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { first: 10, after: cursor },
		});

		expect(result.data?.allUsers).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					path: ["allUsers"],
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["after"],
							}),
						]),
					}),
				}),
			]),
		);
	});

	/**
	 * Test 8: Non-Existent Cursor (Backward Pagination)
	 */
	test("returns arguments_associated_resources_not_found for non-existent before cursor", async () => {
		const token = await getAdminAuthToken();

		const cursor = Buffer.from(
			JSON.stringify({
				id: faker.string.uuid(),
				createdAt: new Date().toISOString(),
			}),
		).toString("base64url");

		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { last: 10, before: cursor },
		});

		expect(result.data?.allUsers).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					path: ["allUsers"],
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["before"],
							}),
						]),
					}),
				}),
			]),
		);
	});

	/**
	 * Test 9: Empty String in Where Name
	 */
	test("returns invalid_arguments for empty where.name", async () => {
		const token = await getAdminAuthToken();

		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { first: 10, where: { name: "" } },
		});

		expect(result.data?.allUsers).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					path: ["allUsers"],
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
				}),
			]),
		);
	});

	/**
	 * Test 9b: Missing Required Fields in Cursor
	 */
	test("returns invalid_arguments for cursor missing required fields", async () => {
		const token = await getAdminAuthToken();

		const incompleteCursor = Buffer.from(
			JSON.stringify({
				id: faker.string.uuid(),
			}),
		).toString("base64url");

		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { first: 10, after: incompleteCursor },
		});

		expect(result.data?.allUsers).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					path: ["allUsers"],
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["after"],
								message: "Not a valid cursor.",
							}),
						]),
					}),
				}),
			]),
		);
	});

	/**
	 * Test 9c: Empty Object as Cursor
	 */
	test("returns invalid_arguments for empty object cursor", async () => {
		const token = await getAdminAuthToken();

		const emptyCursor = Buffer.from(JSON.stringify({})).toString("base64url");

		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { first: 10, after: emptyCursor },
		});

		expect(result.data?.allUsers).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					path: ["allUsers"],
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["after"],
								message: "Not a valid cursor.",
							}),
						]),
					}),
				}),
			]),
		);
	});

	/**
	 * Test 9d: Null Values in Cursor
	 */
	test("returns invalid_arguments for cursor with null values", async () => {
		const token = await getAdminAuthToken();

		const nullCursor = Buffer.from(
			JSON.stringify({
				createdAt: null,
				id: null,
			}),
		).toString("base64url");

		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { first: 10, after: nullCursor },
		});

		expect(result.data?.allUsers).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					path: ["allUsers"],
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["after"],
								message: "Not a valid cursor.",
							}),
						]),
					}),
				}),
			]),
		);
	});

	/* -------------------------------------------------- */
	/* Forward Pagination Tests */
	/* -------------------------------------------------- */

	/**
	 * Test 10: Forward Pagination Without Cursor
	 */
	test("returns users with forward pagination without cursor", async () => {
		const token = await getAdminAuthToken();

		const u1 = await createTestUser();
		const u2 = await createTestUser();

		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { first: 10 },
		});

		expect(result.errors).toBeUndefined();

		const edges: AllUsersEdge[] = result.data?.allUsers?.edges ?? [];
		const ids = edges.map((edge) => edge.node.id);

		expect(ids).toContain(u1.id);
		expect(ids).toContain(u2.id);
	});

	/**
	 * Test 11: Forward Pagination With Cursor
	 */
	test("returns users with forward pagination using after cursor", async () => {
		const token = await getAdminAuthToken();
		const prefix = `ForwardCursor_${faker.string.uuid()}`;

		const baseTime = new Date();

		for (let i = 0; i < 4; i++) {
			await createTestUser({
				name: `${prefix}_${i}`,
				createdAt: new Date(baseTime.getTime() + i * 1000),
			});
		}

		const firstPage = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { first: 2, where: { name: prefix } },
		});

		expect(firstPage.errors).toBeUndefined();

		const endCursor = firstPage.data?.allUsers?.pageInfo?.endCursor;
		assertToBeNonNullish(endCursor);

		const secondPage = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { first: 2, after: endCursor, where: { name: prefix } },
		});

		expect(secondPage.errors).toBeUndefined();
		assertToBeNonNullish(secondPage.data?.allUsers?.edges);

		const edges2: AllUsersEdge[] = secondPage.data.allUsers.edges;
		expect(edges2.length).toBeGreaterThan(0);

		for (const edge of edges2) {
			expect(edge.node.name).toContain(prefix);
		}
	});

	/**
	 * Test 11b: Explicit Coverage for Line 40 & 67 (Forward)
	 * Manually constructs a cursor to ensure the parsing logic is strictly exercised.
	 * Default sort is DESC (Newest first).
	 * To find entries "after", we must pick a user that has older entries following it.
	 * We pick the NEWEST user (userB), so "after" it, we should find the OLDER user (userA).
	 */
	test("forward pagination with manually constructed cursor returns subsequent users", async () => {
		const token = await getAdminAuthToken();

		const baseTime = new Date();

		const userA = await createTestUser({
			createdAt: new Date(baseTime.getTime()),
		});

		const userB = await createTestUser({
			createdAt: new Date(baseTime.getTime() + 1000),
		});

		// List Order (DESC): [UserB, UserA]
		// We cursor on UserB (Top). "After" UserB should be UserA.
		const validCursor = Buffer.from(
			JSON.stringify({
				id: userB.id,
				createdAt: userB.createdAt.toISOString(),
			}),
		).toString("base64url");

		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { first: 10, after: validCursor },
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.allUsers?.edges);

		const edges: AllUsersEdge[] = result.data.allUsers.edges;
		const ids = edges.map((e) => e.node.id);

		expect(ids).toContain(userA.id);
	});

	/**
	 * Test 12: Forward Pagination With Cursor Without Name Filter
	 */
	test("returns users with forward pagination using cursor without name filter", async () => {
		const token = await getAdminAuthToken();

		const baseTime = new Date();

		for (let i = 0; i < 3; i++) {
			await createTestUser({
				createdAt: new Date(baseTime.getTime() + i * 1000),
			});
		}

		const firstPage = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { first: 2 },
		});

		expect(firstPage.errors).toBeUndefined();

		const endCursor = firstPage.data?.allUsers?.pageInfo?.endCursor;
		assertToBeNonNullish(endCursor);

		const secondPage = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { first: 2, after: endCursor },
		});

		expect(secondPage.errors).toBeUndefined();
		assertToBeNonNullish(secondPage.data?.allUsers?.edges);
		expect(secondPage.data.allUsers.edges).toBeDefined();
	});

	/* -------------------------------------------------- */
	/* Backward Pagination Tests */
	/* -------------------------------------------------- */

	/**
	 * Test 13: Backward Pagination Without Cursor
	 */
	test("returns users with backward pagination without cursor", async () => {
		const token = await getAdminAuthToken();
		const prefix = `Backward_${faker.string.uuid()}`;

		await createTestUser({ name: `${prefix}_1` });
		await createTestUser({ name: `${prefix}_2` });
		await createTestUser({ name: `${prefix}_3` });

		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { last: 2, where: { name: prefix } },
		});

		expect(result.errors).toBeUndefined();

		const edges: AllUsersEdge[] = result.data?.allUsers?.edges ?? [];
		expect(edges.length).toBeGreaterThan(0);

		for (const edge of edges) {
			expect(edge.node.name).toContain(prefix);
		}
	});

	/**
	 * Test 14: Backward Pagination With Cursor
	 */
	test("returns users with backward pagination using before cursor", async () => {
		const token = await getAdminAuthToken();
		const prefix = `BackwardCursor_${faker.string.uuid()}`;

		const baseTime = new Date();

		for (let i = 0; i < 4; i++) {
			await createTestUser({
				name: `${prefix}_${i}`,
				createdAt: new Date(baseTime.getTime() + i * 1000),
			});
		}

		const firstPage = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { last: 2, where: { name: prefix } },
		});

		expect(firstPage.errors).toBeUndefined();

		const startCursor = firstPage.data?.allUsers?.pageInfo?.startCursor;
		assertToBeNonNullish(startCursor);

		const secondPage = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { last: 2, before: startCursor, where: { name: prefix } },
		});

		expect(secondPage.errors).toBeUndefined();
		assertToBeNonNullish(secondPage.data?.allUsers?.edges);

		const edges: AllUsersEdge[] = secondPage.data.allUsers.edges;
		expect(edges.length).toBeGreaterThan(0);

		for (const edge of edges) {
			expect(edge.node.name).toContain(prefix);
		}
	});

	/**
	 * Test 14b: Explicit Coverage for Line 40 & 67 (Backward)
	 * Manually constructs a cursor for backward pagination.
	 * Default sort is DESC (Newest first).
	 * List: [UserB, UserA].
	 * To find "before", we must pick a user that has newer entries preceding it.
	 * We pick the OLDEST user (userA). "Before" it, we should find the NEWER user (userB).
	 */
	test("backward pagination with manually constructed cursor returns preceding users", async () => {
		const token = await getAdminAuthToken();

		const baseTime = new Date();

		const userA = await createTestUser({
			createdAt: new Date(baseTime.getTime()),
		});

		const userB = await createTestUser({
			createdAt: new Date(baseTime.getTime() + 1000),
		});

		// List Order (DESC): [UserB, UserA]
		// We cursor on UserA (Bottom). "Before" UserA should be UserB.
		const validCursor = Buffer.from(
			JSON.stringify({
				id: userA.id,
				createdAt: userA.createdAt.toISOString(),
			}),
		).toString("base64url");

		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { last: 10, before: validCursor },
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.allUsers?.edges);

		const edges: AllUsersEdge[] = result.data.allUsers.edges;
		const ids = edges.map((e) => e.node.id);

		expect(ids).toContain(userB.id);
	});

	/**
	 * Test 15: Backward Pagination With Cursor Without Name Filter
	 */
	test("returns users with backward pagination using cursor without name filter", async () => {
		const token = await getAdminAuthToken();

		const baseTime = new Date();

		for (let i = 0; i < 3; i++) {
			await createTestUser({
				createdAt: new Date(baseTime.getTime() + i * 1000),
			});
		}

		const firstPage = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { last: 2 },
		});

		expect(firstPage.errors).toBeUndefined();

		const startCursor = firstPage.data?.allUsers?.pageInfo?.startCursor;
		assertToBeNonNullish(startCursor);

		const secondPage = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { last: 2, before: startCursor },
		});

		expect(secondPage.errors).toBeUndefined();
		assertToBeNonNullish(secondPage.data?.allUsers?.edges);
		expect(secondPage.data.allUsers.edges).toBeDefined();
	});

	/* -------------------------------------------------- */
	/* Name Filtering Tests */
	/* -------------------------------------------------- */

	/**
	 * Test 16: Name Filter
	 */
	test("filters users by name", async () => {
		const token = await getAdminAuthToken();
		const prefix = `Filter_${faker.string.uuid()}`;

		const u1 = await createTestUser({ name: `${prefix}_1` });
		const u2 = await createTestUser({ name: `${prefix}_2` });
		await createTestUser({ name: "OtherUser" });

		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { first: 10, where: { name: prefix } },
		});

		expect(result.errors).toBeUndefined();

		const edges: AllUsersEdge[] = result.data?.allUsers?.edges ?? [];
		const ids = edges.map((edge) => edge.node.id);

		expect(ids).toContain(u1.id);
		expect(ids).toContain(u2.id);
	});

	/**
	 * Test 17: Empty Where Clause
	 */
	test("returns users when where is an empty object", async () => {
		const token = await getAdminAuthToken();

		const u1 = await createTestUser();
		const u2 = await createTestUser();

		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { first: 10, where: {} },
		});

		expect(result.errors).toBeUndefined();

		const edges: AllUsersEdge[] = result.data?.allUsers?.edges ?? [];
		const ids = edges.map((edge) => edge.node.id);

		expect(ids).toContain(u1.id);
		expect(ids).toContain(u2.id);
	});

	/**
	 * Test 18: Omitted Where Clause
	 */
	test("returns users when where argument is omitted", async () => {
		const token = await getAdminAuthToken();

		const u1 = await createTestUser();
		const u2 = await createTestUser();

		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { first: 10 },
		});

		expect(result.errors).toBeUndefined();

		const edges: AllUsersEdge[] = result.data?.allUsers?.edges ?? [];
		const ids = edges.map((edge) => edge.node.id);

		expect(ids).toContain(u1.id);
		expect(ids).toContain(u2.id);
	});

	/* -------------------------------------------------- */
	/* Edge Cases & PageInfo Tests */
	/* -------------------------------------------------- */

	/**
	 * Test 19: Empty Result Set
	 */
	test("returns empty result with correct pageInfo when no users match", async () => {
		const token = await getAdminAuthToken();

		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: {
				first: 10,
				where: { name: `NonExistent_${faker.string.uuid()}` },
			},
		});

		expect(result.errors).toBeUndefined();

		const connection = result.data?.allUsers;
		assertToBeNonNullish(connection);

		expect(connection.edges).toEqual([]);
		expect(connection.pageInfo.hasNextPage).toBe(false);
		expect(connection.pageInfo.hasPreviousPage).toBe(false);
		expect(connection.pageInfo.startCursor).toBeNull();
		expect(connection.pageInfo.endCursor).toBeNull();
	});

	/**
	 * Test 20: Exact Page Size
	 */
	test("sets hasNextPage to false when result count equals page size", async () => {
		const token = await getAdminAuthToken();
		const prefix = `ExactPage_${faker.string.uuid()}`;

		const u1 = await createTestUser({ name: `${prefix}_1` });
		const u2 = await createTestUser({ name: `${prefix}_2` });

		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: {
				first: 2,
				where: { name: prefix },
			},
		});

		expect(result.errors).toBeUndefined();

		const connection = result.data?.allUsers;
		assertToBeNonNullish(connection);

		const edges: AllUsersEdge[] = connection.edges;
		expect(edges.length).toBe(2);
		expect(edges.map((edge) => edge.node.id)).toEqual(
			expect.arrayContaining([u1.id, u2.id]),
		);

		expect(connection.pageInfo.hasNextPage).toBe(false);
	});

	/**
	 * Test 21: Has Next Page
	 */
	test("sets hasNextPage to true when more results exist", async () => {
		const token = await getAdminAuthToken();
		const prefix = `HasNext_${faker.string.uuid()}`;

		await createTestUser({ name: `${prefix}_1` });
		await createTestUser({ name: `${prefix}_2` });
		await createTestUser({ name: `${prefix}_3` });

		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: {
				first: 2,
				where: { name: prefix },
			},
		});

		expect(result.errors).toBeUndefined();

		const connection = result.data?.allUsers;
		assertToBeNonNullish(connection);

		expect(connection.edges.length).toBe(2);
		expect(connection.pageInfo.hasNextPage).toBe(true);
	});

	/**
	 * Test 22: Cursor Encoding
	 */
	test("returns properly encoded cursors", async () => {
		const token = await getAdminAuthToken();

		const user = await createTestUser();

		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { first: 10 },
		});

		expect(result.errors).toBeUndefined();

		const edges: AllUsersEdge[] = result.data?.allUsers?.edges ?? [];
		const userEdge = edges.find((edge) => edge.node.id === user.id);

		assertToBeNonNullish(userEdge);

		const decodedCursor = JSON.parse(
			Buffer.from(userEdge.cursor, "base64url").toString("utf-8"),
		);

		expect(decodedCursor).toHaveProperty("createdAt");
		expect(decodedCursor).toHaveProperty("id");
		expect(decodedCursor.id).toBe(user.id);
		expect(typeof decodedCursor.createdAt).toBe("string");
	});

	/**
	 * Test 23: Ordering Verification
	 */
	test("returns users in descending order by createdAt", async () => {
		const token = await getAdminAuthToken();
		const prefix = `Order_${faker.string.uuid()}`;

		const baseTime = new Date();

		const user1 = await createTestUser({
			name: `${prefix}_1`,
			createdAt: new Date(baseTime.getTime()),
		});

		const user2 = await createTestUser({
			name: `${prefix}_2`,
			createdAt: new Date(baseTime.getTime() + 1000),
		});

		const user3 = await createTestUser({
			name: `${prefix}_3`,
			createdAt: new Date(baseTime.getTime() + 2000),
		});

		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { first: 10, where: { name: prefix } },
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.allUsers?.edges);

		const edges: AllUsersEdge[] = result.data.allUsers.edges;
		const ourUsers = edges.filter((edge) =>
			[user1.id, user2.id, user3.id].includes(edge.node.id),
		);

		expect(ourUsers).toEqual([
			expect.objectContaining({
				node: expect.objectContaining({ id: user3.id }),
			}),
			expect.objectContaining({
				node: expect.objectContaining({ id: user2.id }),
			}),
			expect.objectContaining({
				node: expect.objectContaining({ id: user1.id }),
			}),
		]);
	});

	/**
	 * Test 24: Ascending Order (Backward Pagination)
	 */
	test("uses ascending order internally for backward pagination", async () => {
		const token = await getAdminAuthToken();
		const prefix = `AscOrder_${faker.string.uuid()}`;

		const baseTime = new Date();

		const user1 = await createTestUser({
			name: `${prefix}_1`,
			createdAt: new Date(baseTime.getTime()),
		});

		const user2 = await createTestUser({
			name: `${prefix}_2`,
			createdAt: new Date(baseTime.getTime() + 1000),
		});

		const user3 = await createTestUser({
			name: `${prefix}_3`,
			createdAt: new Date(baseTime.getTime() + 2000),
		});

		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { last: 3, where: { name: prefix } },
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.allUsers?.edges);

		const edges: AllUsersEdge[] = result.data.allUsers.edges;
		const ourUsers = edges.filter((edge) =>
			[user1.id, user2.id, user3.id].includes(edge.node.id),
		);

		expect(ourUsers.length).toBe(3);
		expect(ourUsers.map((u) => u.node.id)).toContain(user1.id);
		expect(ourUsers.map((u) => u.node.id)).toContain(user2.id);
		expect(ourUsers.map((u) => u.node.id)).toContain(user3.id);
	});

	/**
	 * Test 25: Complexity Calculation with First Parameter
	 */
	test("executes query successfully with first parameter at maximum limit", async () => {
		const token = await getAdminAuthToken();

		await createTestUser();

		// Query with explicit first parameter (within limit of 32)
		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { first: 32 },
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.allUsers);
	});

	/**
	 * Test 26: Complexity Calculation with Last Parameter
	 */
	test("executes query successfully with last parameter within limit", async () => {
		const token = await getAdminAuthToken();

		await createTestUser();

		// Query with explicit last parameter (within limit of 32)
		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: { last: 20 },
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.allUsers);
	});

	/**
	 * Test 27: Explicit Null Where Clause
	 * Verifies that passing explicit null for the where argument
	 * is handled gracefully by falling back to return all users.
	 */

	test("handles explicit null where argument safely", async () => {
		const token = await getAdminAuthToken();
		const u1 = await createTestUser();

		// Pass explicitly null where
		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: {
				first: 10,
				where: null, // <--- Explicit null triggers the fallback check
			},
		});

		expect(result.errors).toBeUndefined();

		// Should function exactly like an empty where/omitted where (return all users)
		const edges: AllUsersEdge[] = result.data?.allUsers?.edges ?? [];
		const ids = edges.map((edge) => edge.node.id);
		expect(ids).toContain(u1.id);
	});

	/**
	 * Test 28: Explicit Null Name in Where
	 * Verifies that passing null to a string field returns an invalid_arguments error.
	 */
	test("returns invalid_arguments when where.name is explicit null", async () => {
		const token = await getAdminAuthToken();

		const result = await mercuriusClient.query(AllUsersQuery, {
			headers: { authorization: `Bearer ${token}` },
			variables: {
				first: 10,
				where: { name: null },
			},
		});

		// Expect an error because name cannot be null
		expect(result.data?.allUsers).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["where", "name"],
								message: "Expected string, received null",
							}),
						]),
					}),
				}),
			]),
		);
	});
});
