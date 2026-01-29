import { faker } from "@faker-js/faker";
import type { GraphQLObjectType } from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { schema } from "~/src/graphql/schema";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_deleteOrganization,
	Mutation_updateOrganization,
	Query_signIn,
} from "../documentNodes";

async function createTestOrganization(token: string): Promise<string> {
	const result = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${token}` },
		variables: {
			input: {
				name: `Metrics Test Org ${faker.string.ulid()}`,
				description: faker.lorem.sentence(),
				countryCode: "us",
				state: "CA",
				city: "San Francisco",
				postalCode: "94101",
				addressLine1: faker.location.streetAddress(),
			},
		},
	});
	if (result.errors) {
		throw new Error(
			`Failed to create test organization: ${JSON.stringify(result.errors)}`,
		);
	}
	const orgId = result.data?.createOrganization?.id;
	assertToBeNonNullish(orgId);
	return orgId;
}

const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});
if (signInResult.errors) {
	throw new Error(
		`Admin sign-in failed: ${JSON.stringify(signInResult.errors)}`,
	);
}
assertToBeNonNullish(signInResult.data?.signIn);
const authToken = signInResult.data.signIn.authenticationToken;
assertToBeNonNullish(authToken);

describe("Mutation updateOrganization - Performance Tracking", () => {
	describe("integration (mercuriusClient)", () => {
		it("should update organization and return data on success", async () => {
			const orgId = await createTestOrganization(authToken);
			const newName = `Updated Org ${faker.string.ulid()}`;
			const newDescription = "Updated description";

			const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: orgId,
						name: newName,
						description: newDescription,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateOrganization).toBeDefined();
			expect(result.data?.updateOrganization?.id).toBe(orgId);
			expect(result.data?.updateOrganization?.name).toBe(newName);
			expect(result.data?.updateOrganization?.description).toBe(newDescription);

			// Cleanup
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: orgId } },
			});
		});

		it("should return unauthenticated error when no auth token provided", async () => {
			const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
				variables: {
					input: {
						id: faker.string.uuid(),
						name: "Updated Name",
					},
				},
			});

			expect(result.data?.updateOrganization).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["updateOrganization"],
					}),
				]),
			);
		});

		it("should return invalid_arguments error for invalid organization id", async () => {
			const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: "not-a-valid-uuid",
						name: "Updated Name",
					},
				},
			});

			expect(result.data?.updateOrganization).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
						path: ["updateOrganization"],
					}),
				]),
			);
		});

		it("should return arguments_associated_resources_not_found when organization does not exist", async () => {
			const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: faker.string.uuid(),
						name: "Updated Name",
					},
				},
			});

			expect(result.data?.updateOrganization).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["updateOrganization"],
					}),
				]),
			);
		});

		it("should return unauthorized_action when non-admin user tries to update", async () => {
			const { authToken: regularUserToken } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularUserToken);

			const orgId = await createTestOrganization(authToken);

			const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: {
					input: {
						id: orgId,
						name: "Updated by Regular User",
					},
				},
			});

			expect(result.data?.updateOrganization).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action",
						}),
						path: ["updateOrganization"],
					}),
				]),
			);

			// Cleanup: delete org as admin
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: orgId } },
			});
		});
	});

	describe("perf (unit) – direct resolver for timing assertions", () => {
		let updateOrganizationMutationResolver: (
			_parent: unknown,
			args: { input: Record<string, unknown> },
			ctx: ReturnType<typeof createMockGraphQLContext>["context"],
		) => Promise<unknown>;

		const createMockAdminUser = () => ({
			id: "admin-user",
			role: "administrator" as const,
		});

		const createMockExistingOrganization = (
			orgId: string,
			avatarName: string | null = null,
		) => ({
			id: orgId,
			avatarName,
		});

		const createMockUpdatedOrganization = (
			orgId: string,
			orgName: string,
			updaterId = "admin-user",
		) => ({
			id: orgId,
			name: orgName,
			description: "Updated Description",
			addressLine1: null,
			addressLine2: null,
			city: null,
			countryCode: null,
			postalCode: null,
			state: null,
			avatarMimeType: null,
			avatarName: null,
			creatorId: "creator-id",
			updaterId,
			createdAt: new Date(),
			updatedAt: new Date(),
			userRegistrationRequired: false,
		});

		const createMockTransaction = (
			mockUpdatedOrganization: ReturnType<typeof createMockUpdatedOrganization>,
		) => {
			return async (callback: (tx: unknown) => Promise<unknown>) => {
				const mockTx = {
					update: vi.fn().mockReturnValue({
						set: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								returning: vi.fn().mockResolvedValue([mockUpdatedOrganization]),
							}),
						}),
					}),
				};
				return callback(mockTx as never);
			};
		};

		beforeEach(() => {
			vi.useFakeTimers();
			vi.clearAllMocks();
			const mutationType = schema.getType("Mutation") as GraphQLObjectType;
			const updateOrganizationField =
				mutationType.getFields().updateOrganization;
			if (!updateOrganizationField) {
				throw new Error("updateOrganization mutation field not found");
			}
			updateOrganizationMutationResolver =
				updateOrganizationField.resolve as typeof updateOrganizationMutationResolver;
			if (!updateOrganizationMutationResolver) {
				throw new Error("updateOrganization mutation resolver not found");
			}
		});

		afterEach(() => {
			vi.useRealTimers();
			vi.clearAllMocks();
		});

		it("should record mutation:updateOrganization in perf snapshot when resolver is invoked directly", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			context.perf = perf;

			const orgId = faker.string.uuid();
			const orgName = `Updated Org ${faker.string.ulid()}`;
			const mockAdminUser = createMockAdminUser();
			const mockExistingOrganization = createMockExistingOrganization(orgId);
			const mockUpdatedOrganization = createMockUpdatedOrganization(
				orgId,
				orgName,
			);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockAdminUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockExistingOrganization,
			);
			(
				mocks.drizzleClient as unknown as {
					transaction: ReturnType<typeof vi.fn>;
				}
			).transaction = vi
				.fn()
				.mockImplementation(createMockTransaction(mockUpdatedOrganization));

			const resultPromise = updateOrganizationMutationResolver(
				null,
				{
					input: {
						id: orgId,
						name: orgName,
						description: "Updated Description",
					},
				},
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toBeDefined();
			expect(result).toMatchObject({
				id: orgId,
				name: orgName,
				description: "Updated Description",
			});

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:updateOrganization"];
			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});
	});
});
