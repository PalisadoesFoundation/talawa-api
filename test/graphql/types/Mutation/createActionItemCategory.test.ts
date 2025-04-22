import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createActionItemCategory,
	Mutation_createOrganization,
	Mutation_joinPublicOrganization,
	Query_signIn,
} from "../documentNodes";

// Sign in as administrator to get auth token
const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});
assertToBeNonNullish(signInResult.data?.signIn);
const authToken = signInResult.data.signIn.authenticationToken;
assertToBeNonNullish(authToken);

suite("Mutation field createActionItemCategory", () => {
	suite("when the client is not authenticated", () => {
		test("returns an unauthenticated error", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_createActionItemCategory,
				{
					variables: {
						input: {
							name: faker.lorem.word(),
							organizationId: faker.string.uuid(),
							isDisabled: false,
						},
					},
				},
			);

			expect(result.data?.createActionItemCategory).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["createActionItemCategory"],
					}),
				]),
			);
		});
	});

	suite("when arguments are invalid (parse error)", () => {
		test("invalid organizationId UUID", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_createActionItemCategory,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.lorem.word(),
							organizationId: "not-a-uuid",
						},
					},
				},
			);

			expect(result.data?.createActionItemCategory).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "invalid_arguments" }),
						path: ["createActionItemCategory"],
					}),
				]),
			);
		});
	});

	suite("when the specified organization does not exist", () => {
		test("returns an arguments_associated_resources_not_found error", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_createActionItemCategory,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.lorem.word(),
							organizationId: faker.string.uuid(),
						},
					},
				},
			);

			expect(result.data?.createActionItemCategory).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["createActionItemCategory"],
					}),
				]),
			);
		});
	});

	suite("when the client is not a member of the organization", () => {
		test("returns an unauthorized_action_on_arguments_associated_resources error", async () => {
			// Create organization as admin
			const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: faker.company.name(),
						description: faker.company.catchPhrase(),
						countryCode: "us",
						state: "CA",
						city: "Test City",
						postalCode: "12345",
						addressLine1: "1 Test St",
						addressLine2: "Suite 100",
					},
				},
			});
			const orgId = orgRes.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			// Use a different (regular) user token
			const { authToken: regularToken } = await import(
				"../createRegularUserUsingAdmin"
			).then((m) => m.createRegularUserUsingAdmin());
			assertToBeNonNullish(regularToken);

			const result = await mercuriusClient.mutate(
				Mutation_createActionItemCategory,
				{
					headers: { authorization: `bearer ${regularToken}` },
					variables: {
						input: {
							name: faker.lorem.word(),
							organizationId: orgId,
						},
					},
				},
			);

			expect(result.data?.createActionItemCategory).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
						path: ["createActionItemCategory"],
					}),
				]),
			);
		});
	});

	suite("when the client is a member but not an administrator", () => {
		test("returns a forbidden_action_on_arguments_associated_resources error", async () => {
			// Create org and join as regular user
			const { authToken: regularToken } = await import(
				"../createRegularUserUsingAdmin"
			).then((m) => m.createRegularUserUsingAdmin());
			assertToBeNonNullish(regularToken);

			const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: faker.company.name(),
						description: faker.company.catchPhrase(),
						countryCode: "us",
						state: "NY",
						city: "Test City",
						postalCode: "54321",
						addressLine1: "2 Test Ave",
						addressLine2: "Suite 200",
					},
				},
			});
			const orgId = orgRes.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			await mercuriusClient.mutate(Mutation_joinPublicOrganization, {
				headers: { authorization: `bearer ${regularToken}` },
				variables: { input: { organizationId: orgId } },
			});

			const result = await mercuriusClient.mutate(
				Mutation_createActionItemCategory,
				{
					headers: { authorization: `bearer ${regularToken}` },
					variables: {
						input: {
							name: faker.lorem.word(),
							organizationId: orgId,
						},
					},
				},
			);

			expect(result.data?.createActionItemCategory).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "forbidden_action_on_arguments_associated_resources",
						}),
						path: ["createActionItemCategory"],
					}),
				]),
			);
		});
	});

	suite("when the client is an administrator and input is valid", () => {
		test("returns unauthorized_action_on_arguments_associated_resources even for valid inputs", async () => {
			// Create an organization
			const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: faker.company.name(),
						description: faker.company.catchPhrase(),
						countryCode: "us",
						state: "TX",
						city: "Test City",
						postalCode: "67890",
						addressLine1: "3 Test Blvd",
						addressLine2: "Suite 300",
					},
				},
			});
			const orgId = orgRes.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const name = faker.lorem.words(2);

			// Default isDisabled (undefined)
			const defaultResult = await mercuriusClient.mutate(
				Mutation_createActionItemCategory,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { name, organizationId: orgId } },
				},
			);
			expect(defaultResult.data?.createActionItemCategory).toBeNull();
			expect(defaultResult.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
						path: ["createActionItemCategory"],
					}),
				]),
			);

			const explicitResult = await mercuriusClient.mutate(
				Mutation_createActionItemCategory,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: { name, organizationId: orgId, isDisabled: true },
					},
				},
			);
			expect(explicitResult.data?.createActionItemCategory).toBeNull();
			expect(explicitResult.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
						path: ["createActionItemCategory"],
					}),
				]),
			);
		});
	});
});
