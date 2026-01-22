import { faker } from "@faker-js/faker";
import type { ResultOf, VariablesOf } from "gql.tada";
import type { ExecutionResult } from "graphql";
import { afterEach, expect, suite, test, vi } from "vitest";

import type {
	ForbiddenActionOnArgumentsAssociatedResourcesExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import { Mutation_createOrganization, Query_signIn } from "../documentNodes";

// Helper for calling createOrganization
const createOrganization = async (
	variables: VariablesOf<typeof Mutation_createOrganization>,
	authToken: string = "",
): Promise<
	ExecutionResult<{
		createOrganization:
			| ResultOf<typeof Mutation_createOrganization>["createOrganization"]
			| null;
	}>
> => {
	return mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${authToken}` },
		variables,
	});
};

// Error assertion helper
const expectSpecificError = (
	result: ExecutionResult,
	expectedError: Partial<TalawaGraphQLFormattedError>,
) => {
	expect(result.data?.createOrganization).toBeNull();
	expect(result.errors).toEqual(
		expect.arrayContaining([expect.objectContaining(expectedError)]),
	);
};

suite("Mutation field createOrganization", () => {
	let adminAuthToken: string;
	// Setup admin auth before tests
	test("setup admin auth", async () => {
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(adminSignInResult.data?.signIn?.authenticationToken);
		adminAuthToken = adminSignInResult.data.signIn.authenticationToken;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	suite("Error Handling", () => {
		test("should reject unauthenticated requests", async () => {
			const result = await createOrganization(
				{
					input: {
						name: faker.company.name(),
						countryCode: "us",
					},
				},
				"", // No token
			);

			expectSpecificError(result, {
				extensions: expect.objectContaining<UnauthenticatedExtensions>({
					code: "unauthenticated",
				}),
			});
		});

		test("should reject unauthorized requests (non-admins)", async () => {
			// Use dependency injection or create a regular user for this test
			const { authToken: regularToken } = await createRegularUserUsingAdmin();

			const result = await createOrganization(
				{
					input: {
						name: faker.company.name(),
						countryCode: "us",
					},
				},
				regularToken,
			);

			expectSpecificError(result, {
				extensions: expect.objectContaining<UnauthorizedActionExtensions>({
					code: "unauthorized_action",
				}),
			});
		});

		test("should reject duplicate organization names", async () => {
			const name = `Duplicate Corp ${faker.string.ulid()}`;

			// Pre-seed an organization
			await createOrganization(
				{
					input: {
						name,
						countryCode: "us",
					},
				},
				adminAuthToken,
			);

			// Try to create again with same name
			const result = await createOrganization(
				{
					input: {
						name,
						countryCode: "us",
					},
				},
				adminAuthToken,
			);

			// Assert forbidden action as requested in prompt
			expectSpecificError(result, {
				extensions:
					expect.objectContaining<ForbiddenActionOnArgumentsAssociatedResourcesExtensions>(
						{
							code: "forbidden_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								{ argumentPath: ["input", "name"] },
							]),
						},
					),
			});
		});

		test("should reject invalid avatar mime type", async () => {
			// We need to use multipart request to properly test file uploads
			const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;
			const operations = JSON.stringify({
				query: `mutation CreateOrg($input: MutationCreateOrganizationInput!) {
                     createOrganization(input: $input) { id }
                 }`,
				variables: {
					input: {
						name: "Invalid Mime Org",
						countryCode: "us",
						avatar: null, // Placeholder
					},
				},
			});

			const map = JSON.stringify({
				"0": ["variables.input.avatar"],
			});

			const body = [
				`--${boundary}`,
				'Content-Disposition: form-data; name="operations"',
				"",
				operations,
				`--${boundary}`,
				'Content-Disposition: form-data; name="map"',
				"",
				map,
				`--${boundary}`,
				'Content-Disposition: form-data; name="0"; filename="bad.txt"',
				"Content-Type: text/plain", // Invalid mime
				"",
				"not an image",
				`--${boundary}--`,
			].join("\r\n");

			const response = await server.inject({
				method: "POST",
				url: "/graphql",
				headers: {
					"content-type": `multipart/form-data; boundary=${boundary}`,
					authorization: `bearer ${adminAuthToken}`,
				},
				payload: body,
			});

			const result = JSON.parse(response.body);
			expect(result.errors).toBeDefined();
			// The schema transform adds an issue with code "custom" and path ["avatar"]
			// But schema validation errors are typically returned as invalid_arguments by mercurius/zod integration or similar
			const error = result.errors[0];
			expect(error.extensions.code).toBe("invalid_arguments");
			expect(error.extensions.issues).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						message: expect.stringContaining("Mime type"), // Basic check
					}),
				]),
			);
		});

		test("should handle avatar upload failure", async () => {
			const putObjectSpy = vi
				.spyOn(server.minio.client, "putObject")
				.mockRejectedValue(new Error("Upload Failed"));

			// We need to trigger the upload path
			const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;
			const operations = JSON.stringify({
				query: `mutation CreateOrg($input: MutationCreateOrganizationInput!) {
                    createOrganization(input: $input) { id }
                }`,
				variables: {
					input: {
						name: "Upload Fail Org",
						countryCode: "us",
						avatar: null,
					},
				},
			});

			const map = JSON.stringify({
				"0": ["variables.input.avatar"],
			});

			const body = [
				`--${boundary}`,
				'Content-Disposition: form-data; name="operations"',
				"",
				operations,
				`--${boundary}`,
				'Content-Disposition: form-data; name="map"',
				"",
				map,
				`--${boundary}`,
				'Content-Disposition: form-data; name="0"; filename="test.png"',
				"Content-Type: image/png",
				"",
				"fake-content",
				`--${boundary}--`,
			].join("\r\n");

			try {
				const response = await server.inject({
					method: "POST",
					url: "/graphql",
					headers: {
						"content-type": `multipart/form-data; boundary=${boundary}`,
						authorization: `bearer ${adminAuthToken}`,
					},
					payload: body,
				});

				const result = JSON.parse(response.body);
				// Expecting an error, likely "unexpected" or specific upload error depending on implementation
				// Checking if it threw TalawaGraphQLError or generic
				expect(result.errors).toBeDefined();
			} finally {
				putObjectSpy.mockRestore();
			}
		});
	});
});
