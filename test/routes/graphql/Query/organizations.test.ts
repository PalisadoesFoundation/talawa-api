import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	InvalidArgumentsExtensions,
	UnauthorizedActionExtensions,
	TalawaGraphQLFormattedError,
} from "~/src/utilities/TalawaGraphQLError";
import { mercuriusClient } from "../client";
import { Query_organizations } from "../documentNodes";

suite("Query field organizations", () => {
	suite(
		`results in a graphql error with "invalid_arguments" extensions code in the "errors" field and "null" as the value of "data.organizations" field if`,
		() => {
			test("input validation fails with invalid ID format", async () => {
				const result = await mercuriusClient.query(Query_organizations, {
					variables: {
						input: {
							id: "invalid-id-format",
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

	suite(
		`results in a graphql error with "arguments_associated_resources_not_found" extensions code in the "errors" field and "null" as the value of "data.organizations" field if`,
		() => {
			test("organization with provided ID does not exist", async () => {
				const nonExistentId = faker.string.ulid();
				const result = await mercuriusClient.query(Query_organizations, {
					variables: {
						input: {
							id: nonExistentId,
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

	suite("successfully returns organizations data", () => {
		test("returns a single organization when ID is provided", async () => {
			// Assuming we have a known organization ID in the test database
			const knownOrganizationId = "known-org-id"; // Replace with actual test data
			const result = await mercuriusClient.query(Query_organizations, {
				variables: {
					input: {
						id: knownOrganizationId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data.organizations).toHaveLength(1);
			expect(result.data.organizations).not.toBeNull();
			expect(result.data.organizations![0]).toEqual(
				expect.objectContaining({
					id: knownOrganizationId,
					// Add other expected organization fields
				}),
			);
		});

		test("returns multiple organizations (max 20) when no ID is provided", async () => {
			const result = await mercuriusClient.query(Query_organizations, {
				variables: {},
			});

			expect(result.errors).toBeUndefined();
			expect(Array.isArray(result.data.organizations)).toBe(true);
			expect(result.data.organizations).not.toBeNull();
			expect(result.data.organizations!.length).toBeLessThanOrEqual(20);
			expect(result.data.organizations && result.data.organizations[0]).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					// Add other expected organization fields
				}),
			);
		});
	});

	suite("handles unauthorized access", () => {
		test("returns unauthorized_action error when user lacks permissions", async () => {
			// Simulate an unauthorized request (implementation depends on your auth setup)
			const result = await mercuriusClient.query(Query_organizations, {
				headers: {
					authorization: "bearer invalid_token",
				},
				variables: {},
			});

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
