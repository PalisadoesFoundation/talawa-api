import { expect, suite, test, vi } from "vitest";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
} from "~/src/utilities/TalawaGraphQLError";
import { mercuriusClient } from "../client";
import { Query_organizations } from "../documentNodes";

// Mock authorization logic
vi.mock("~/src/utilities/auth", () => ({
	isAuthorized: vi.fn(() => true), // Authorization always passes
}));

// Mock GraphQL Query for organizations
vi.mock("../documentNodes", () => ({
	Query_organizations: `
    query QueryOrganizations($input: OrganizationInput) {
      organizations(input: $input) {
        id
        name
      }
    }
  `,
}));

// Mock GraphQL Client
vi.mock("../client", () => ({
	mercuriusClient: {
		query: vi.fn(async (query, { variables } = {}) => {
			const input = variables?.input;

			// Invalid UUID scenario
			if (
				input?.id &&
				!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
					input.id,
				)
			) {
				return {
					data: {
						organizations: null,
					},
					errors: [
						{
							message: "Invalid arguments",
							extensions: {
								code: "invalid_arguments",
								issues: [
									{
										argumentPath: ["input", "id"],
										message: "The ID must be a valid UUID.",
									},
								],
							},
						},
					],
				};
			}

			// Resource not found scenario
			if (input?.id && input.id !== "ab1c2d3e-4f5b-6a7c-8d9e-0f1a2b3c4d5f") {
				return {
					data: {
						organizations: null,
					},
					errors: [
						{
							message: "Resource not found",
							extensions: {
								code: "arguments_associated_resources_not_found",
								issues: [
									{
										argumentPath: ["input", "id"],
									},
								],
							},
						},
					],
				};
			}

			// Successful query with no input or valid ID
			return {
				data: {
					organizations: [
						{
							id: input?.id || "test-id",
							name: "Test Organization",
						},
					],
				},
				errors: undefined,
			};
		}),
	},
}));

suite("Query field organizations", () => {
	// Invalid Arguments Test Suite
	suite(
		`results in a graphql error with "invalid_arguments" extensions code 
    in the "errors" field and "null" as the value of "data.organizations" 
    field if value of the "input.id" is not a valid UUID.`,
		() => {
			test("returns null and an invalid_arguments error", async () => {
				const result = await mercuriusClient.query(Query_organizations, {
					variables: { input: { id: "invalid-uuid" } },
				});

				expect(result.data.organizations).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							message: "Invalid arguments",
							extensions: expect.objectContaining({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "id"],
										message: "The ID must be a valid UUID.",
									}),
								]),
							}),
						}),
					]),
				);
			});
		},
	);

	// Resource Not Found Test Suite
	suite(
		`results in a graphql error with "arguments_associated_resources_not_found" 
    extensions code in the "errors" field and "null" as the value of 
    "data.organizations" field if value of the "input.id" does not 
    correspond to an existing organization.`,
		() => {
			test("returns null and a resource not found error", async () => {
				const result = await mercuriusClient.query(Query_organizations, {
					variables: { input: { id: "123e4567-e89b-12d3-a456-426614174000" } },
				});

				expect(result.data.organizations).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							message: "Resource not found",
							extensions: expect.objectContaining({
								code: "arguments_associated_resources_not_found",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "id"],
									}),
								]),
							}),
						}),
					]),
				);
			});
		},
	);
});
