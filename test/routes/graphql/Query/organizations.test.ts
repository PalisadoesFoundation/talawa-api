import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
} from "~/src/utilities/TalawaGraphQLError";
import { mercuriusClient } from "../client";
import { Query_organizations } from "../documentNodes";

suite("Query field organizations", () => {
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

	test(`returns a specific organization when a valid "input.id" is provided.`, async () => {
		const validOrganizationId = "your-existing-organization-id"; // Replace with a valid ID for testing

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
