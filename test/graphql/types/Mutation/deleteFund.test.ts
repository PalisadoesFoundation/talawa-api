import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { initGraphQLTada } from "gql.tada";
import { expect, suite, test } from "vitest";

import { fundsTable } from "~/src/drizzle/tables/funds";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";

import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import { Mutation_createOrganization, Query_signIn } from "../documentNodes";
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

const Mutation_deleteFund = gql(`
	mutation Mutation_deleteFund($input: MutationDeleteFundInput!) {
		deleteFund(input: $input) {
			id
		}
	}
`);

/**
 * Local test helper.
 * Creates an organization using global admin credentials.
 * Scoped to this test file intentionally.
 */
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

suite("deleteFund mutation", () => {
	test("returns unauthenticated error when user is not logged in", async () => {
		const result = await mercuriusClient.mutate(Mutation_deleteFund, {
			variables: {
				input: {
					id: faker.string.uuid(),
				},
			},
		});

		expect(result.data?.deleteFund ?? null).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
				}),
			]),
		);
	});

	test("returns invalid_arguments for malformed input", async () => {
		const { authToken } = await createRegularUserUsingAdmin();

		const result = await mercuriusClient.mutate(Mutation_deleteFund, {
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				input: {
					id: "",
				},
			},
		});

		expect(result.data?.deleteFund ?? null).toBeNull();
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

	test("returns resource not found error when fund does not exist", async () => {
		const { authToken } = await createRegularUserUsingAdmin();

		const result = await mercuriusClient.mutate(Mutation_deleteFund, {
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				input: {
					id: faker.string.uuid(),
				},
			},
		});

		expect(result.data?.deleteFund ?? null).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
					}),
				}),
			]),
		);
	});

	test("returns unauthorized error when user is not an administrator", async () => {
		const fundCreator = await createRegularUserUsingAdmin();
		const user = await createRegularUserUsingAdmin();
		const orgId = await createTestOrganization();
		const fundId = faker.string.uuid();

		await server.drizzleClient.insert(fundsTable).values({
			id: fundId,
			name: "Test Fund",
			isTaxDeductible: false,
			organizationId: orgId,
			creatorId: fundCreator.userId,
		});

		const result = await mercuriusClient.mutate(Mutation_deleteFund, {
			headers: {
				authorization: `bearer ${user.authToken}`,
			},
			variables: {
				input: {
					id: fundId,
				},
			},
		});

		expect(result.data?.deleteFund ?? null).toBeNull();
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

	test("returns resource not found error when fund is deleted before mutation runs", async () => {
		const admin = await createRegularUserUsingAdmin();
		const orgId = await createTestOrganization();
		const fundId = faker.string.uuid();

		await server.drizzleClient.insert(fundsTable).values({
			id: fundId,
			name: "Test Fund",
			isTaxDeductible: false,
			organizationId: orgId,
			creatorId: admin.userId,
		});

		await server.drizzleClient.insert(organizationMembershipsTable).values({
			memberId: admin.userId,
			organizationId: orgId,
			role: "administrator",
		});

		await server.drizzleClient
			.delete(fundsTable)
			.where(eq(fundsTable.id, fundId));

		const result = await mercuriusClient.mutate(Mutation_deleteFund, {
			headers: {
				authorization: `bearer ${admin.authToken}`,
			},
			variables: {
				input: { id: fundId },
			},
		});

		expect(result.data?.deleteFund ?? null).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
					}),
				}),
			]),
		);
	});

	test("successfully deletes fund when user is organization administrator", async () => {
		const user = await createRegularUserUsingAdmin();
		const orgId = await createTestOrganization();
		const fundId = faker.string.uuid();

		await server.drizzleClient.insert(fundsTable).values({
			id: fundId,
			name: "Test Fund",
			isTaxDeductible: false,
			organizationId: orgId,
			creatorId: user.userId,
		});

		await server.drizzleClient.insert(organizationMembershipsTable).values({
			memberId: user.userId,
			organizationId: orgId,
			role: "administrator",
		});

		const result = await mercuriusClient.mutate(Mutation_deleteFund, {
			headers: {
				authorization: `bearer ${user.authToken}`,
			},
			variables: {
				input: {
					id: fundId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.deleteFund?.id).toBe(fundId);

		const rows = await server.drizzleClient
			.select()
			.from(fundsTable)
			.where(eq(fundsTable.id, fundId));

		expect(rows.length).toBe(0);
	});
});
