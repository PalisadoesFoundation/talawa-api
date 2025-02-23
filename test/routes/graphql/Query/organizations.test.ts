import { faker } from "@faker-js/faker";
import { expect, suite, test, beforeEach, vi } from "vitest";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
} from "~/src/utilities/TalawaGraphQLError";
import { mercuriusClient } from "../client";
import { Query_organizations } from "../documentNodes";

// More comprehensive mocking
beforeEach(() => {
	// Clear all mocks before each test
	vi.clearAllMocks();

	// Mock the auth module
	vi.mock("~/src/utilities/auth", () => ({
		isAuthorized: vi.fn().mockReturnValue(true),
		// Add any other auth-related functions that might need mocking
	}));

	// If there's middleware or a plugin handling auth, mock those too
	vi.mock("~/src/middleware/auth", () => ({
		checkAuth: vi.fn().mockReturnValue(true),
	}));
});

suite("Query field organizations", () => {
	// Invalid Arguments Test Suite
	suite(
		`results in a graphql error with "invalid_arguments" extensions code in the "errors" field and "null" as the value of "data.organizations" field if`,
		() => {
			test(`value of the "input.id" is not a valid UUID.`, async () => {
				const result = await mercuriusClient.query(Query_organizations, {
					variables: {
						input: {
							id: "invalid-uuid",
						},
					},
				});

				// First verify auth worked
				expect(result.errors?.[0]?.extensions?.code).not.toBe(
					"unauthorized_action",
				);

				// Then check the expected validation error
				expect(result.data.organizations).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									{
										argumentPath: ["input", "id"],
										message: expect.any(String),
									},
								]),
							}),
							message: expect.any(String),
							path: ["organizations"],
						}),
					]),
				);
			});
		},
	);

	// Arguments Associated Resources Not Found Test Suite
	suite(
		`results in a graphql error with "arguments_associated_resources_not_found" extensions code in the "errors" field and "null" as the value of "data.organizations" field if`,
		() => {
			test(`value of the "input.id" does not correspond to an existing organization.`, async () => {
				const result = await mercuriusClient.query(Query_organizations, {
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				});

				// First verify auth worked
				expect(result.errors?.[0]?.extensions?.code).not.toBe(
					"unauthorized_action",
				);

				// Then check the expected not found error
				expect(result.data.organizations).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
									{
										code: "arguments_associated_resources_not_found",
										issues: expect.arrayContaining([
											{
												argumentPath: ["input", "id"],
											},
										]),
									},
								),
							message: expect.any(String),
							path: ["organizations"],
						}),
					]),
				);
			});
		},
	);

	// Successful Queries
	test("returns a list of organizations when no input is provided.", async () => {
		const result = await mercuriusClient.query(Query_organizations);

		// First verify auth worked
		expect(result.errors).toBeUndefined();

		expect(result.data.organizations).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: expect.any(String),
					name: expect.any(String),
				}),
			]),
		);
	});

	test(`returns a specific organization when a valid "input.id" is provided.`, async () => {
		const validOrganizationId = "ab1c2d3e-4f5b-6a7c-8d9e-0f1a2b3c4d5f";

		const result = await mercuriusClient.query(Query_organizations, {
			variables: {
				input: {
					id: validOrganizationId,
				},
			},
		});

		// First verify auth worked
		expect(result.errors).toBeUndefined();

		expect(result.data.organizations).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: validOrganizationId,
					name: expect.any(String),
				}),
			]),
		);
	});
});
