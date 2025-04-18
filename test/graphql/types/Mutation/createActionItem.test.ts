import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createActionItem,
	Mutation_createOrganization,
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

// Helper to set Authorization header correctly
const asAdmin = { Authorization: `Bearer ${authToken}` };

suite("Mutation field createActionItem", () => {
	suite("when the client is not authenticated", () => {
		test("returns an unauthenticated error", async () => {
			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				variables: {
					input: {
						organizationId: faker.string.uuid(),
						categoryId: faker.string.uuid(),
						assigneeId: faker.string.uuid(),
						assignedAt: new Date().toISOString(),
						preCompletionNotes: faker.lorem.sentence(),
						eventId: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.createActionItem).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["createActionItem"],
					}),
				]),
			);
		});
	});

	suite("when arguments are invalid (parse error)", () => {
		test("invalid organizationId UUID", async () => {
			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: "not-a-uuid",
						categoryId: faker.string.uuid(),
						assigneeId: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.createActionItem).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "invalid_arguments" }),
						path: ["createActionItem"],
					}),
				]),
			);
		});

		test("invalid categoryId UUID", async () => {
			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: faker.string.uuid(),
						categoryId: "not-a-uuid",
						assigneeId: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.createActionItem).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "invalid_arguments" }),
						path: ["createActionItem"],
					}),
				]),
			);
		});

		test("invalid assigneeId UUID", async () => {
			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: faker.string.uuid(),
						categoryId: faker.string.uuid(),
						assigneeId: "not-a-uuid",
					},
				},
			});

			expect(result.data?.createActionItem).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "invalid_arguments" }),
						path: ["createActionItem"],
					}),
				]),
			);
		});
	});

	suite("when the specified organization does not exist", () => {
		test("returns an arguments_associated_resources_not_found error", async () => {
			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: faker.string.uuid(),
						categoryId: faker.string.uuid(),
						assigneeId: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.createActionItem).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["createActionItem"],
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

			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				headers: { authorization: `bearer ${regularToken}` },
				variables: {
					input: {
						organizationId: orgId,
						categoryId: faker.string.uuid(),
						assigneeId: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.createActionItem).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
						path: ["createActionItem"],
					}),
				]),
			);
		});
	});

	suite("when the client is not authenticated", () => {
		test("returns an unauthenticated error", async () => {
			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				variables: {
					input: {
						organizationId: faker.string.uuid(),
						categoryId: faker.string.uuid(),
						assigneeId: faker.string.uuid(),
						assignedAt: new Date().toISOString(),
						preCompletionNotes: faker.lorem.sentence(),
						eventId: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.createActionItem).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["createActionItem"],
					}),
				]),
			);
		});
	});

	suite("when arguments are invalid (parse error)", () => {
		test("invalid organizationId UUID", async () => {
			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				headers: asAdmin,
				variables: {
					input: {
						organizationId: "not-a-uuid",
						categoryId: faker.string.uuid(),
						assigneeId: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.createActionItem).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "invalid_arguments" }),
						path: ["createActionItem"],
					}),
				]),
			);
		});

		test("invalid categoryId UUID", async () => {
			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				headers: asAdmin,
				variables: {
					input: {
						organizationId: faker.string.uuid(),
						categoryId: "not-a-uuid",
						assigneeId: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.createActionItem).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "invalid_arguments" }),
						path: ["createActionItem"],
					}),
				]),
			);
		});

		test("invalid assigneeId UUID", async () => {
			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				headers: asAdmin,
				variables: {
					input: {
						organizationId: faker.string.uuid(),
						categoryId: faker.string.uuid(),
						assigneeId: "not-a-uuid",
					},
				},
			});

			expect(result.data?.createActionItem).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "invalid_arguments" }),
						path: ["createActionItem"],
					}),
				]),
			);
		});
	});

	suite("when the specified organization does not exist", () => {
		test("returns an arguments_associated_resources_not_found error", async () => {
			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				headers: asAdmin,
				variables: {
					input: {
						organizationId: faker.string.uuid(),
						categoryId: faker.string.uuid(),
						assigneeId: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.createActionItem).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["createActionItem"],
					}),
				]),
			);
		});
	});

	suite("when the client is not a member of the organization", () => {
		test("returns an unauthorized_action_on_arguments_associated_resources error", async () => {
			// Create organization as admin
			const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
				headers: asAdmin,
				variables: {
					input: {
						name: `${faker.company.name()} ${faker.string.uuid()}`,
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

			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				headers: { Authorization: `Bearer ${regularToken}` },
				variables: {
					input: {
						organizationId: orgId,
						categoryId: faker.string.uuid(),
						assigneeId: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.createActionItem).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
						path: ["createActionItem"],
					}),
				]),
			);
		});
	});
});
