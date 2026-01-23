import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { Mutation_createOrganization, Query_signIn } from "../documentNodes";

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
		// Mock the drizzle insert to return empty array
		// We have to mock server.drizzleClient.transaction or insert
		// createOrganization uses transaction -> insert -> values -> returning

		// We spy on 'transaction' to spy on the transaction object provided to callback?
		// Or easier: spy on 'insert' of the table? But drizzle client structure is complex.
		// The easiest way for simple "insert returns []" simulation in this codebase:
		// Monkey patch the drizzle client method temporarily.

		const originalTransaction = server.drizzleClient.transaction;

		// We mock transaction to execute the callback but with a mocked tx object
		server.drizzleClient.transaction = vi
			.fn()
			.mockImplementation(async (callback) => {
				const mockTx = {
					insert: vi.fn().mockReturnThis(),
					values: vi.fn().mockReturnThis(),
					returning: vi.fn().mockResolvedValue([]), // Return empty array to fail check
					// createOrganization also calls query.organizationsTable.findFirst inside/outside tx?
					// Actually findFirst is called outside tx usually for name check.
					// Inside tx it inserts.
					// It also inserts organizationMembersTable inside tx?
					// createOrganization.ts: line 155: insert(organizationsTable).values(...).returning()
				};
				return callback(mockTx);
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
			// Restore
			server.drizzleClient.transaction = originalTransaction;
		}
	});

	it("should rollback (delete organization) when avatar upload fails", async () => {
		// Mock failure
		const minioClient = server.minio.client;
		const putObjectSpy = vi
			.spyOn(minioClient, "putObject")
			.mockRejectedValue(new Error("Simulated Upload Failure"));

		const name = `Rollback Org ${faker.string.ulid()}`;

		// Construct multipart request
		const boundary = "----Boundary";
		const operations = {
			query: `mutation CreateOrg($input: MutationCreateOrganizationInput!) {
                createOrganization(input: $input) { id }
            }`,
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
		const org = server.drizzleClient.query.organizationsTable.findFirst({
			where: eq(organizationsTable.name, name),
		});

		expect(org).toBeUndefined();

		putObjectSpy.mockRestore();
	});
});
