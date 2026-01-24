import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createUser,
	Mutation_deleteCurrentUser,
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

	it("should return unauthenticated error when client is not authenticated", async () => {
		const result = await mercuriusClient.mutate(Mutation_createOrganization, {
			// No authorization header
			variables: {
				input: {
					name: `Unauthenticated Org ${faker.string.ulid()}`,
					countryCode: "us",
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
		expect(result.data?.createOrganization).toBeNull();
	});

	it("should return unauthorized error when user is not administrator", async () => {
		// Create a regular (non-admin) user
		const emailAddress = `regular${faker.string.ulid()}@email.com`;
		let regularUserToken: string | undefined;
		let createdUserId: string | undefined;

		try {
			const createUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							emailAddress,
							isEmailAddressVerified: false,
							name: "Regular User",
							password: "password",
							role: "regular",
						},
					},
				},
			);
			assertToBeNonNullish(
				createUserResult.data?.createUser?.authenticationToken,
			);
			regularUserToken = createUserResult.data.createUser.authenticationToken;
			createdUserId = createUserResult.data?.createUser?.user?.id;

			// Try to create organization as regular user
			const result = await mercuriusClient.mutate(Mutation_createOrganization, {
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: {
					input: {
						name: `Unauthorized Org ${faker.string.ulid()}`,
						countryCode: "us",
					},
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthorized_action");
			expect(result.data?.createOrganization).toBeNull();
		} finally {
			// Cleanup: delete the created user
			if (createdUserId && regularUserToken) {
				await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
					headers: { authorization: `bearer ${regularUserToken}` },
				});
			}
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
			expect(result.data?.createOrganization).toBeNull();
			expect(putObjectSpy).toHaveBeenCalled();

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

	it("should return invalid_arguments when avatar mime type is not allowed", async () => {
		const boundary = "----BoundaryInvalidAvatar";
		const operations = {
			query: `mutation CreateOrg($input: MutationCreateOrganizationInput!) {
                createOrganization(input: $input) { id }
            }`,
			variables: {
				input: {
					name: `Invalid Avatar Org ${faker.string.ulid()}`,
					description: "Invalid avatar mime test",
					countryCode: "us",
					city: "Test City",
					postalCode: "12345",
					addressLine1: "123 St",
					state: "NY",
					avatar: null,
				},
			},
		};
		const map = { "0": ["variables.input.avatar"] };
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
			'Content-Disposition: form-data; name="0"; filename="test.txt"',
			"Content-Type: text/plain",
			"",
			"not-an-image",
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
		expect(result.data?.createOrganization).toBeNull();
		expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
		expect(result.errors?.[0]?.extensions?.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					message: 'Mime type "text/plain" is not allowed.',
				}),
			]),
		);
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

	it("should return unauthenticated error when currentUser query returns undefined", async () => {
		// Mock usersTable.findFirst to return undefined (user not found after authentication)
		const findFirstSpy = vi
			.spyOn(server.drizzleClient.query.usersTable, "findFirst")
			.mockResolvedValue(undefined);

		try {
			const result = await mercuriusClient.mutate(Mutation_createOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: `User Not Found Org ${faker.string.ulid()}`,
						countryCode: "us",
					},
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
			expect(result.data?.createOrganization).toBeNull();
		} finally {
			findFirstSpy.mockRestore();
		}
	});
});
