import { faker } from "@faker-js/faker";
import { assertToBeNonNullish } from "test/helpers";
import { afterAll, beforeAll, expect, suite, test } from "vitest";
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteOrganization,
	Mutation_deleteOrganizationMembership,
	Mutation_deleteUser,
	Query_organizations,
} from "../documentNodes";

type Organization = {
	id: string;
};

suite("Query field organizations", () => {
	let adminAuth = "";
	let regularUser1Email = "";
	let regularUser1Id = "";
	let regularUser1Auth = "";
	let regularUser2Email = "";
	let regularUser3Email = "";
	let regularUser2Id = "";
	let regularUser3Id = "";
	let regularUser2Auth = "";
	let regularUser3Auth = "";
	let org1Id = "";
	let org2Id = "";

	beforeAll(async () => {
		const { accessToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(accessToken);
		adminAuth = accessToken;

		// Create regular user 1
		regularUser1Email = `email${faker.string.ulid()}@email.com`;
		const createUser1Result = await mercuriusClient.mutate(
			Mutation_createUser,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					input: {
						emailAddress: regularUser1Email,
						isEmailAddressVerified: false,
						name: "Regular User 1",
						password: "password",
						role: "regular",
					},
				},
			},
		);
		assertToBeNonNullish(createUser1Result.data.createUser?.user?.id);
		regularUser1Id = createUser1Result.data.createUser.user.id;

		// Create regular user 2
		regularUser2Email = `email${faker.string.ulid()}@email.com`;
		const createUser2Result = await mercuriusClient.mutate(
			Mutation_createUser,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					input: {
						emailAddress: regularUser2Email,
						isEmailAddressVerified: false,
						name: "Regular User 2",
						password: "password",
						role: "regular",
					},
				},
			},
		);
		assertToBeNonNullish(createUser2Result.data.createUser?.user?.id);
		regularUser2Id = createUser2Result.data.createUser.user.id;

		// Create regular user 3
		regularUser3Email = `email${faker.string.ulid()}@email.com`;
		const createUser3Result = await mercuriusClient.mutate(
			Mutation_createUser,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					input: {
						emailAddress: regularUser3Email,
						isEmailAddressVerified: false,
						name: "Regular User 3",
						password: "password",
						role: "regular",
					},
				},
			},
		);
		assertToBeNonNullish(createUser3Result.data.createUser?.user?.id);
		regularUser3Id = createUser3Result.data.createUser.user.id;

		// Sign in as regular users (REST)
		const r1 = await server.inject({
			method: "POST",
			url: "/auth/signin",
			payload: { email: regularUser1Email, password: "password" },
		});
		regularUser1Auth =
			r1.cookies.find(
				(c: { name: string }) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
			)?.value ?? "";
		assertToBeNonNullish(regularUser1Auth);

		const r2 = await server.inject({
			method: "POST",
			url: "/auth/signin",
			payload: { email: regularUser2Email, password: "password" },
		});
		regularUser2Auth =
			r2.cookies.find(
				(c: { name: string }) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
			)?.value ?? "";
		assertToBeNonNullish(regularUser2Auth);

		const r3 = await server.inject({
			method: "POST",
			url: "/auth/signin",
			payload: { email: regularUser3Email, password: "password" },
		});
		regularUser3Auth =
			r3.cookies.find(
				(c: { name: string }) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
			)?.value ?? "";
		assertToBeNonNullish(regularUser3Auth);

		// delete user 3
		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: {
				authorization: `bearer ${adminAuth}`,
			},
			variables: {
				input: {
					id: regularUser3Id,
				},
			},
		});

		// Create organizations
		const org1Result = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					input: {
						countryCode: "us",
						name: `Test Organization 1 ${faker.string.alphanumeric(8)}`,
					},
				},
			},
		);
		assertToBeNonNullish(org1Result.data?.createOrganization);
		org1Id = org1Result.data.createOrganization.id;

		const org2Result = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					input: {
						countryCode: "ca",
						name: `Test Organization 2 ${faker.string.alphanumeric(8)}`,
					},
				},
			},
		);
		assertToBeNonNullish(org2Result.data?.createOrganization);
		org2Id = org2Result.data.createOrganization.id;

		// Make regular user 1 an admin of organization 1
		const orgMembership = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					input: {
						memberId: regularUser1Id,
						organizationId: org1Id,
						role: "administrator",
					},
				},
			},
		);
		assertToBeNonNullish(orgMembership.data?.createOrganizationMembership);
	});

	afterAll(async () => {
		// Clean up organization memberships
		await mercuriusClient.mutate(Mutation_deleteOrganizationMembership, {
			headers: {
				authorization: `bearer ${adminAuth}`,
			},
			variables: {
				input: {
					organizationId: org1Id,
					memberId: regularUser1Id,
				},
			},
		});

		// Clean up organizations
		await mercuriusClient.mutate(Mutation_deleteOrganization, {
			headers: {
				authorization: `bearer ${adminAuth}`,
			},
			variables: {
				input: {
					id: org1Id,
				},
			},
		});

		await mercuriusClient.mutate(Mutation_deleteOrganization, {
			headers: {
				authorization: `bearer ${adminAuth}`,
			},
			variables: {
				input: {
					id: org2Id,
				},
			},
		});

		// Clean up users
		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: {
				authorization: `bearer ${adminAuth}`,
			},
			variables: {
				input: {
					id: regularUser1Id,
				},
			},
		});

		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: {
				authorization: `bearer ${adminAuth}`,
			},
			variables: {
				input: {
					id: regularUser2Id,
				},
			},
		});
	});

	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.organizations" field if`,
		() => {
			test("client triggering the graphql operation without authentication token, should receive all organization", async () => {
				const result = await mercuriusClient.query(Query_organizations, {
					variables: {},
				});

				expect(result.errors).toBeUndefined();
				expect(result.data.organizations?.length).toBeGreaterThan(1);
			});

			test("client triggering the graphql operation is not authenticated delete user.", async () => {
				const result = await mercuriusClient.query(Query_organizations, {
					headers: {
						authorization: `bearer ${regularUser3Auth}`,
					},
					variables: {},
				});

				expect(result.data.organizations).toEqual(null);
			});
		},
	);

	test("administrator can access all organizations without filter", async () => {
		const result = await mercuriusClient.query(Query_organizations, {
			headers: {
				authorization: `bearer ${adminAuth}`,
			},
			variables: {},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data.organizations?.length).toBeGreaterThan(1);
	});

	test("regular user who is an organization admin can only access organizations they administer", async () => {
		const result = await mercuriusClient.query(Query_organizations, {
			headers: {
				authorization: `bearer ${regularUser1Auth}`,
			},
			variables: {},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data.organizations).toHaveLength(1);
		expect(result.data.organizations).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: org1Id,
				}),
			]),
		);
		// Should not contain org2
		expect(
			result.data?.organizations?.find(
				(org: Organization) => org.id === org2Id,
			),
		).toBeUndefined();
	});

	test("regular user with no admin privileges can see all organizations", async () => {
		const result = await mercuriusClient.query(Query_organizations, {
			headers: {
				authorization: `bearer ${regularUser2Auth}`,
			},
			variables: {},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data.organizations?.length).toBeGreaterThan(1);
	});
});
