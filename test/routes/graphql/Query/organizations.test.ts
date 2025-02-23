import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
	UnauthorizedActionExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { mercuriusClient } from "../client";
import { Query_organizations } from "../documentNodes";

// Define TypeScript interfaces for the GraphQL response
interface Organization {
	id: string;
	// Add other relevant fields here, e.g., name, description, etc.
}

interface QueryResult {
	data: {
		organizations: Organization[] | null;
	};
	errors?: TalawaGraphQLFormattedError[];
}

suite("Query field organizations", () => {
	suite(
		`results in a graphql error with "invalid_arguments" extensions code in the "errors" field and "null" as the value of "data.organizations" field if`,
		() => {
			test("input validation fails with invalid ID format", async () => {
				const result = (await mercuriusClient.query(Query_organizations, {
					variables: {
						input: {
							id: "invalid-id-format",
						},
					},
				})) as QueryResult;

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

	suite(
		`results in a graphql error with "arguments_associated_resources_not_found" extensions code in the "errors" field and "null" as the value of "data.organizations" field if`,
		() => {
			test("organization with provided ID does not exist", async () => {
				const nonExistentId = faker.string.ulid();
				const result = (await mercuriusClient.query(Query_organizations, {
					variables: {
						input: {
							id: nonExistentId,
						},
					},
				})) as QueryResult;

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

	suite("successfully returns organizations data", () => {
		test("returns a single organization when ID is provided", async () => {
			const knownOrganizationId = "ab1c2d3e-4f5b-6a7c-8d9e-0f1a2b3c4d5f"; // Replace with actual test data
			const result = (await mercuriusClient.query(Query_organizations, {
				variables: {
					input: {
						id: knownOrganizationId,
					},
				},
			})) as QueryResult;

			expect(result.errors).toBeUndefined();
			expect(Array.isArray(result.data.organizations)).toBe(true);
			expect(result.data.organizations).not.toBeNull();
			expect(result.data.organizations?.length).toBe(1);
			expect(result.data.organizations?.[0]).toEqual(
				expect.objectContaining<Organization>({
					id: knownOrganizationId,
				}),
			);
		});

		test("returns multiple organizations (max 20) when no ID is provided", async () => {
			const result = (await mercuriusClient.query(Query_organizations, {
				variables: {},
			})) as QueryResult;

			expect(result.errors).toBeUndefined();
			expect(Array.isArray(result.data.organizations)).toBe(true);
			expect(result.data.organizations).not.toBeNull();
			expect(result.data.organizations?.length).toBeLessThanOrEqual(20);
			expect(result.data.organizations?.[0]).toEqual(
				expect.objectContaining<Organization>({
					id: expect.any(String),
				}),
			);
		});
	});

	suite("handles unauthorized access", () => {
		test("returns unauthorized_action error when user lacks permissions", async () => {
			const result = (await mercuriusClient.query(Query_organizations, {
				headers: {
					authorization: "bearer invalid_token",
				},
				variables: {},
			})) as QueryResult;

			expect(result.data.organizations).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthorizedActionExtensions>({
							code: "unauthorized_action",
						}),
						message: expect.any(String),
						path: ["organizations"],
					}),
				]),
			);
		});
	});
});
