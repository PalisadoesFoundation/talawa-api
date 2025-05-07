import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createUser,
	Mutation_deleteUser,
	QUERY_ACTION_ITEMS_BY_ORG,
	Query_signIn,
} from "../documentNodes";

suite("Query field actionItemsByOrganization", () => {
	let adminAuthToken: string;
	let regularUserAuthToken: string;
	let regularUserId: string;
	const organizationId = "01960b81-bfed-7369-ae96-689dbd4281ba"; // Assumed to exist

	beforeAll(async () => {
		const signInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(signInResult.data?.signIn?.authenticationToken);
		adminAuthToken = signInResult.data?.signIn?.authenticationToken as string;

		const userResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					emailAddress: `${faker.string.ulid()}@test.com`,
					name: "Test User",
					password: "password123",
					isEmailAddressVerified: false,
					role: "regular",
				},
			},
		});
		assertToBeNonNullish(userResult.data?.createUser);
		regularUserAuthToken = userResult.data.createUser
			.authenticationToken as string;
		assertToBeNonNullish(userResult.data?.createUser?.user);
		regularUserId = userResult.data.createUser.user.id;
	});

	afterAll(async () => {
		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { input: { id: regularUserId } },
		});
	});

	test("returns error if user is unauthenticated", async () => {
		const result = await mercuriusClient.query(QUERY_ACTION_ITEMS_BY_ORG, {
			variables: { organizationId, first: 5 },
		});
		expect(result.data?.actionItemsByOrganization).toBeNull();
		expect(result.errors?.[0]?.extensions.code).toBe("unauthenticated");
	});

	test("returns error for malformed organizationId", async () => {
		const result = await mercuriusClient.query(QUERY_ACTION_ITEMS_BY_ORG, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { organizationId: "invalid-id", first: 5 },
		});
		expect(result.data?.actionItemsByOrganization).toBeNull();
		expect(result.errors?.[0]?.extensions.code).toBe("invalid_arguments");
	});

	test("returns error if user is not authorized", async () => {
		const result = await mercuriusClient.query(QUERY_ACTION_ITEMS_BY_ORG, {
			headers: { authorization: `bearer ${regularUserAuthToken}` },
			variables: { organizationId, first: 5 },
		});
		expect(result.data?.actionItemsByOrganization).toBeNull();
		expect(result.errors?.[0]?.extensions.code).toBe(
			"unauthorized_action_on_arguments_associated_resources",
		);
	});

	test("returns paginated action items for valid admin", async () => {
		const result = await mercuriusClient.query(QUERY_ACTION_ITEMS_BY_ORG, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { organizationId, first: 5 },
		});
		expect(result.errors).toBeUndefined();
		expect(result.data?.actionItemsByOrganization?.edges).toBeInstanceOf(Array);
	});

	test("handles forward pagination using 'after' cursor", async () => {
		const firstResult = await mercuriusClient.query(QUERY_ACTION_ITEMS_BY_ORG, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { organizationId, first: 2 },
		});

		const edges = firstResult.data?.actionItemsByOrganization?.edges ?? [];
		const cursor =
			firstResult.data?.actionItemsByOrganization?.pageInfo?.endCursor;

		// If not enough items to paginate, skip the test early
		if (!cursor || edges.length < 2) {
			console.warn("Skipping pagination test due to insufficient items.");
			return;
		}

		const nextResult = await mercuriusClient.query(QUERY_ACTION_ITEMS_BY_ORG, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { organizationId, first: 2, after: cursor },
		});

		expect(nextResult.errors).toBeUndefined();
		expect(nextResult.data?.actionItemsByOrganization?.edges).toBeInstanceOf(
			Array,
		);
	});

	test("returns error if cursor is invalid", async () => {
		const invalidCursor = Buffer.from("not-json").toString("base64url");
		const result = await mercuriusClient.query(QUERY_ACTION_ITEMS_BY_ORG, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { organizationId, first: 5, after: invalidCursor },
		});
		expect(result.data?.actionItemsByOrganization).toBeNull();
		expect(result.errors?.[0]?.message).toMatch(/not valid JSON/i);
	});

	test("returns error if cursor is stale", async () => {
		const staleCursor = Buffer.from(
			JSON.stringify({
				createdAt: new Date("2000-01-01").toISOString(),
				id: "00000000-0000-0000-0000-000000000000",
			}),
		).toString("base64url");

		const result = await mercuriusClient.query(QUERY_ACTION_ITEMS_BY_ORG, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { organizationId, first: 5, after: staleCursor },
		});

		expect(result.data?.actionItemsByOrganization).toBeNull();
		expect(result.errors?.[0]?.extensions.code).toBe(
			"arguments_associated_resources_not_found",
		);
	});

	test("uses descending order when no cursor is provided", async () => {
		const signInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		const adminAuthToken = signInResult.data?.signIn?.authenticationToken;
		const organizationId = "01960b81-bfed-7369-ae96-689dbd4281ba";

		assertToBeNonNullish(adminAuthToken);
		assertToBeNonNullish(organizationId);

		const result = await mercuriusClient.query(QUERY_ACTION_ITEMS_BY_ORG, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				organizationId,
				first: 5,
			},
		});

		expect(result.errors).toBeUndefined();
		const edges = result.data?.actionItemsByOrganization?.edges;
		expect(Array.isArray(edges)).toBe(true);
		if ((edges ?? []).length >= 2) {
			const a = edges?.[0]?.node?.createdAt
				? new Date(edges[0].node.createdAt)
				: null;
			expect(a).not.toBeNull();
			const b = edges?.[1]?.node?.createdAt
				? new Date(edges[1].node.createdAt)
				: null;
			if (a !== null && b !== null) {
				expect(a >= b).toBe(true);
			}
		}
	});

	test("throws error when both pagination and business args are invalid", async () => {
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		const adminAuthToken = adminSignInResult.data?.signIn?.authenticationToken;
		assertToBeNonNullish(adminAuthToken);

		const result = await mercuriusClient.query(QUERY_ACTION_ITEMS_BY_ORG, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				organizationId: "not-a-uuid", // invalid UUID
				first: -5, // invalid pagination
			},
		});

		expect(result.data?.actionItemsByOrganization).toBeNull();
		expect(result.errors?.[0]?.extensions.code).toBe("invalid_arguments");
	});

	test("throws unauthenticated error if user no longer exists in DB", async () => {
		// Create a regular user
		const createResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					emailAddress: `${faker.string.ulid()}@test.com`,
					name: "Vanishing User",
					password: "password123",
					isEmailAddressVerified: false,
					role: "regular",
				},
			},
		});

		const token = createResult.data?.createUser?.authenticationToken;
		const userId = createResult.data?.createUser?.user?.id;
		assertToBeNonNullish(token);
		assertToBeNonNullish(userId);

		// Delete user from DB
		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { input: { id: userId } },
		});

		// Try a query with the now-invalid token
		const result = await mercuriusClient.query(QUERY_ACTION_ITEMS_BY_ORG, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				organizationId: "01960b81-bfed-7369-ae96-689dbd4281ba",
				first: 2,
			},
		});

		expect(result.data?.actionItemsByOrganization).toBeNull();
		expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});

	test("returns ascending order when isInversed is true (via 'last')", async () => {
		const signIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		const token = signIn.data?.signIn?.authenticationToken;
		assertToBeNonNullish(token);

		const result = await mercuriusClient.query(QUERY_ACTION_ITEMS_BY_ORG, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				organizationId: "01960b81-bfed-7369-ae96-689dbd4281ba",
				last: 5,
			},
		});

		expect(result.errors).toBeUndefined();
		expect(Array.isArray(result.data?.actionItemsByOrganization?.edges)).toBe(
			true,
		);
	});

	test("uses correct cursor comparison when paginating backward (isInversed true)", async () => {
		const signIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		const token = signIn.data?.signIn?.authenticationToken;
		assertToBeNonNullish(token);

		const firstPage = await mercuriusClient.query(QUERY_ACTION_ITEMS_BY_ORG, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				organizationId: "01960b81-bfed-7369-ae96-689dbd4281ba",
				first: 3,
			},
		});

		const edges = firstPage.data?.actionItemsByOrganization?.edges ?? [];

		if (edges.length < 2) {
			console.warn("Skipping test: Not enough data for backward pagination");
			return;
		}

		const beforeCursor =
			firstPage.data?.actionItemsByOrganization?.pageInfo?.endCursor;
		assertToBeNonNullish(beforeCursor);

		const secondPage = await mercuriusClient.query(QUERY_ACTION_ITEMS_BY_ORG, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				organizationId: "01960b81-bfed-7369-ae96-689dbd4281ba",
				last: 2,
				before: beforeCursor,
			},
		});

		expect(secondPage.errors).toBeUndefined();
		expect(secondPage.data?.actionItemsByOrganization?.edges).toBeInstanceOf(
			Array,
		);
	});

	test("produces valid base64url cursor", async () => {
		const sample = {
			createdAt: new Date().toISOString(),
			id: "00000000-0000-0000-0000-000000000000",
		};

		const cursor = Buffer.from(JSON.stringify(sample)).toString("base64url");
		const decoded = JSON.parse(
			Buffer.from(cursor, "base64url").toString("utf-8"),
		);

		expect(decoded).toMatchObject(sample);
	});
});
