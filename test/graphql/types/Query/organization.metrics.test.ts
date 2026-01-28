import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteOrganization,
	Query_organization,
	Query_signIn,
} from "../documentNodes";

const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});
assertToBeNonNullish(signInResult.data?.signIn);
const authToken = signInResult.data?.signIn?.authenticationToken;
const adminUserId = signInResult.data?.signIn?.user?.id;
assertToBeNonNullish(authToken);
assertToBeNonNullish(adminUserId);

suite("Query field organization - Functional Testing", () => {
	suite("when input validation fails", () => {
		test("should handle invalid input gracefully", async () => {
			const result = await mercuriusClient.query(Query_organization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: "", // empty string validation failure
					},
					first: 10,
				},
			});

			assertToBeNonNullish(result.errors);
			expect(result.errors).toHaveLength(1);
			expect(result.errors).toContainEqual(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.any(Array),
					}),
				}),
			);
		});

		test("should return error for non-existent organization ID", async () => {
			const result = await mercuriusClient.query(Query_organization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: faker.string.uuid(),
					},
					first: 10,
				},
			});

			assertToBeNonNullish(result.errors);
			expect(result.errors).toHaveLength(1);
			expect(result.errors).toContainEqual(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "id"],
							}),
						]),
					}),
				}),
			);
		});
	});

	suite("when organization exists", () => {
		test("should successfully return organization data", async () => {
			// Create an organization first
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Test Organization ${faker.string.ulid()}`,
							description: "Organization for query testing",
							countryCode: "us",
							state: "CA",
							city: "Los Angeles",
							postalCode: "90001",
							addressLine1: "123 Main Street",
							addressLine2: "Suite 100",
						},
					},
				},
			);

			const orgId = createOrgResult.data?.createOrganization?.id;
			expect(createOrgResult.errors).toBeUndefined();
			assertToBeNonNullish(orgId);

			// Add admin as organization member
			const membershipResult = await mercuriusClient.mutate(
				Mutation_createOrganizationMembership,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							memberId: adminUserId,
							organizationId: orgId,
							role: "administrator",
						},
					},
				},
			);
			expect(membershipResult.errors).toBeUndefined();

			// Query the organization
			const result = await mercuriusClient.query(Query_organization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: orgId,
					},
					first: 10,
				},
			});

			// Verify the query was successful
			expect(result.errors).toBeUndefined();
			expect(result.data?.organization).toBeDefined();
			expect(result.data?.organization?.id).toBe(orgId);
			expect(result.data?.organization?.name).toBe(
				createOrgResult.data?.createOrganization?.name,
			);

			// Cleanup
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: orgId,
					},
				},
			});
		});

		test("should return organization with members field", async () => {
			// Create an organization
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Test Org with Members ${faker.string.ulid()}`,
							description: "Organization for members testing",
							countryCode: "us",
							state: "NY",
							city: "New York",
							postalCode: "10001",
							addressLine1: "456 Broadway",
							addressLine2: "Floor 5",
						},
					},
				},
			);

			const orgId = createOrgResult.data?.createOrganization?.id;
			expect(createOrgResult.errors).toBeUndefined();
			assertToBeNonNullish(orgId);

			// Add admin as organization member with administrator role
			const membershipResult = await mercuriusClient.mutate(
				Mutation_createOrganizationMembership,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							memberId: adminUserId,
							organizationId: orgId,
							role: "administrator",
						},
					},
				},
			);
			expect(membershipResult.errors).toBeUndefined();

			// Query the organization with members
			const result = await mercuriusClient.query(Query_organization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: orgId,
					},
					first: 10,
				},
			});

			// Verify the query was successful and members are returned
			expect(result.errors).toBeUndefined();
			expect(result.data?.organization).toBeDefined();
			expect(result.data?.organization?.id).toBe(orgId);
			expect(result.data?.organization?.members).toBeDefined();
			expect(result.data?.organization?.members?.edges).toBeDefined();
			expect(
				(result.data?.organization?.members?.edges?.length ?? 0) > 0,
			).toBeTruthy();

			// Verify admin is a member
			const adminMember = result.data?.organization?.members?.edges?.find(
				(edge) => edge?.node?.id === adminUserId,
			);
			expect(adminMember).toBeDefined();
			expect(adminMember?.node?.role).toBe("administrator");

			// Cleanup
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: orgId,
					},
				},
			});
		});
	});
});
