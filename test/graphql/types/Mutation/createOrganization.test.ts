import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_deleteOrganization,
	Query_signIn,
} from "../documentNodes";

describe("Mutation createOrganization", () => {
	let authToken: string;

	beforeEach(async () => {
		const signInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(signInResult.data.signIn?.authenticationToken);
		authToken = signInResult.data.signIn.authenticationToken;
	});

	let createdOrgId: string | undefined;

	afterEach(async () => {
		// Clean up created organization
		if (createdOrgId) {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: createdOrgId } },
			});
			createdOrgId = undefined;
		}
	});

	it("should return forbidden error when creating organization with duplicate name", async () => {
		const name = `Duplicate_Org_${faker.string.ulid()}`;

		// Create first org
		const firstResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name,
						description: "First Org",
					},
				},
			},
		);
		assertToBeNonNullish(firstResult.data.createOrganization?.id);
		createdOrgId = firstResult.data.createOrganization.id;

		// Attempt to create second org with same name
		const result = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name,
					description: "Second Org",
				},
			},
		});

		expect(result.data?.createOrganization).toBeNull();
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe(
			"forbidden_action_on_arguments_associated_resources",
		);
		expect(result.errors?.[0]?.extensions?.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					message: "This name is not available.",
				}),
			]),
		);
	});

	it("should return unexpected error when database insert returns empty", async () => {
		// NOTE: This test mocks server.drizzleClient.transaction to simulate an empty insert result.
		// This approach is tightly coupled to createOrganization's transaction usage and may break
		// if the resolver's transaction structure changes. Consider using a more resilient approach
		// (e.g., DB constraint violation via real test DB) if this test becomes flaky.

		const transactionSpy = vi
			.spyOn(server.drizzleClient, "transaction")
			.mockImplementation(async (callback) => {
				const mockTx = {
					insert: vi.fn().mockReturnThis(),
					values: vi.fn().mockReturnThis(),
					returning: vi.fn().mockResolvedValue([]), // Return empty array to fail check
					query: server.drizzleClient.query,
				};
				return callback(mockTx as unknown as Parameters<typeof callback>[0]);
			});

		try {
			const result = await mercuriusClient.mutate(Mutation_createOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: `Test_Fail_${faker.string.ulid()}`,
						description: "Will fail",
					},
				},
			});

			expect(result.data?.createOrganization).toBeNull();
			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("unexpected");
		} finally {
			transactionSpy.mockRestore();
		}
	});

	it("should rollback (delete organization) when avatar upload fails", async () => {
		// Mock failure
		const minioClient = server.minio.client;
		const putObjectSpy = vi
			.spyOn(minioClient, "putObject")
			.mockRejectedValue(new Error("Simulated Upload Failure"));

		const name = `Rollback Org ${faker.string.ulid()}`;

		try {
			// Construct multipart request
			const boundary = "----Boundary";
			const CREATE_ORGANIZATION_MUTATION = `mutation CreateOrg($input: MutationCreateOrganizationInput!) {
                createOrganization(input: $input) { id }
            }`;
			const operations = {
				query: CREATE_ORGANIZATION_MUTATION,
				variables: {
					input: {
						name,
						description: "Test rollback",
						countryCode: "us",
						city: "Test City",
						postalCode: "12345",
						addressLine1: "123 St",
						state: "NY",
						avatar: null, // Mapped
					},
				},
			};
			const map = { "0": ["variables.input.avatar"] };
			const fileContent = "fake-content";

			const body = [
				`--${boundary}`,
				'Content-Disposition: form-data; name="operations"',
				"",
				JSON.stringify(operations),
				`--${boundary}`,
				'Content-Disposition: form-data; name="map"',
				"",
				JSON.stringify(map),
				`--${boundary}`,
				'Content-Disposition: form-data; name="0"; filename="test.png"',
				"Content-Type: image/png",
				"",
				fileContent,
				`--${boundary}--`,
			].join("\r\n");

			const response = await server.inject({
				method: "POST",
				url: "/graphql",
				headers: {
					"content-type": `multipart/form-data; boundary=${boundary}`,
					authorization: `bearer ${authToken}`,
				},
				payload: body,
			});

			const result = response.json();
			expect(result.errors?.[0]?.extensions?.code).toBe("unexpected");

			// Verify deletion
			const org = await server.drizzleClient.query.organizationsTable.findFirst(
				{
					where: eq(organizationsTable.name, name),
				},
			);

			expect(org).toBeUndefined();
		} finally {
			putObjectSpy.mockRestore();
		}
	});

	it("should handle avatar set to null explicitly", async () => {
		const name = `Null Avatar Org ${faker.string.ulid()}`;

		// Use regular GraphQL mutation (not multipart) since avatar: null is a valid GraphQL value
		const result = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name,
					description: "Test null avatar",
					countryCode: "us",
					city: "Test City",
					postalCode: "12345",
					addressLine1: "123 St",
					state: "NY",
					avatar: null, // Explicitly null - tests the else if (arg.avatar !== undefined) path
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.createOrganization?.id).toBeDefined();
		createdOrgId = result.data?.createOrganization?.id;
	});
});
