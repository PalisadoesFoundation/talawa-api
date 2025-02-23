import { faker } from "@faker-js/faker";
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
	Query_organizations: vi.fn((_, { variables }) => {
		const { input } = variables || {};

		// Invalid UUID scenario
		if (input?.id === "invalid-uuid") {
			return {
				data: {
					organizations: null,
				},
				errors: [
					{
						message: "Invalid UUID",
						extensions: {
							code: "invalid_arguments",
							issues: [
								{
									argumentPath: ["input", "id"],
									message: "Invalid UUID format",
								},
							],
						},
						path: ["organizations"],
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
}));

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

				expect(result.data.organizations).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining<
									InvalidArgumentsExtensions["issues"][number]
								>([
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
							id: faker.string.uuid(), // Random UUID for non-existent org
						},
					},
				});

				expect(result.data.organizations).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
									{
										code: "arguments_associated_resources_not_found",
										issues: expect.arrayContaining<
											ArgumentsAssociatedResourcesNotFoundExtensions["issues"][number]
										>([
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

	// Successful Query with No Input
	test("returns a list of organizations when no input is provided.", async () => {
		const result = await mercuriusClient.query(Query_organizations);

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

	// Successful Query with Valid Input
	test(`returns a specific organization when a valid "input.id" is provided.`, async () => {
		const validOrganizationId = "ab1c2d3e-4f5b-6a7c-8d9e-0f1a2b3c4d5f"; // Matching valid ID

		const result = await mercuriusClient.query(Query_organizations, {
			variables: {
				input: {
					id: validOrganizationId,
				},
			},
		});

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
