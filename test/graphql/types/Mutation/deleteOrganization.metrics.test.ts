import { faker } from "@faker-js/faker";
import type { GraphQLObjectType } from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { schema } from "~/src/graphql/schema";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_deleteOrganization,
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
	if (result.errors?.length) {
		throw new Error(
			`Failed to create test organization: ${JSON.stringify(result.errors)}`,
		);
	}
	const orgId = result.data?.createOrganization?.id;
	assertToBeNonNullish(orgId);
	return orgId;
}

let authToken: string;

describe("Mutation deleteOrganization - Performance Tracking", () => {
	beforeAll(async () => {
		const signInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		if (signInResult.errors?.length) {
			throw new Error(
				`Admin sign-in failed: ${JSON.stringify(signInResult.errors)}`,
			);
		}
		assertToBeNonNullish(signInResult.data?.signIn);
		const token = signInResult.data.signIn.authenticationToken;
		assertToBeNonNullish(token);
		authToken = token;
	});

	describe("integration (mercuriusClient)", () => {
		it("should delete organization and return data on success", async () => {
			const orgId = await createTestOrganization(authToken);

			const result = await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: { id: orgId },
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.deleteOrganization).toBeDefined();
			expect(result.data?.deleteOrganization?.id).toBe(orgId);
			expect(result.data?.deleteOrganization?.name).toBeDefined();
			expect(result.data?.deleteOrganization?.countryCode).toBeDefined();
		});

		it("should return unauthenticated error when no auth token provided", async () => {
			const result = await mercuriusClient.mutate(Mutation_deleteOrganization, {
				variables: {
					input: { id: faker.string.uuid() },
				},
			});

			expect(result.data?.deleteOrganization).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["deleteOrganization"],
					}),
				]),
			);
		});

		it("should return invalid_arguments error for invalid organization id", async () => {
			const result = await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: { id: "not-a-valid-uuid" },
				},
			});

			expect(result.data?.deleteOrganization).toBeNull();
			const errors = result.errors ?? [];
			expect(
				errors.some(
					(error) =>
						error.extensions?.code === "invalid_arguments" ||
						error.message?.includes("got invalid value") ||
						error.message?.includes("cannot represent a non string value") ||
						error.message?.includes("GraphQL validation error") ||
						error.message?.includes("Graphql validation error"),
				),
			).toBe(true);
		});

		it("should return arguments_associated_resources_not_found when organization does not exist", async () => {
			const result = await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: { id: faker.string.uuid() },
				},
			});

			expect(result.data?.deleteOrganization).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["deleteOrganization"],
					}),
				]),
			);
		});

		it("should return unauthorized_action when non-admin user tries to delete", async () => {
			const { authToken: regularUserToken } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularUserToken);

			const orgId = await createTestOrganization(authToken);

			const result = await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: {
					input: { id: orgId },
				},
			});

			expect(result.data?.deleteOrganization).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action",
						}),
						path: ["deleteOrganization"],
					}),
				]),
			);

			// Cleanup: delete org as admin
			const deleteResult = await mercuriusClient.mutate(
				Mutation_deleteOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: orgId } },
				},
			);
			expect(deleteResult.errors).toBeUndefined();
			expect(deleteResult.data?.deleteOrganization).toBeDefined();
			expect(deleteResult.data?.deleteOrganization?.id).toBe(orgId);
		});
	});

	describe("perf (unit) – direct resolver for timing assertions", () => {
		let deleteOrganizationMutationResolver: (
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
			options?: { avatarName?: string | null },
		) => ({
			id: orgId,
			avatarName: (options?.avatarName ?? null) as string | null,
			advertisementsWhereOrganization: [],
			chatsWhereOrganization: [],
			eventsWhereOrganization: [],
			postsWhereOrganization: [],
			venuesWhereOrganization: [],
		});

		const createMockDeletedOrganization = (orgId: string) => ({
			id: orgId,
			name: "Deleted Organization",
			description: null,
			addressLine1: null,
			addressLine2: null,
			city: null,
			countryCode: null,
			postalCode: null,
			state: null,
			avatarMimeType: null,
			avatarName: null,
			creatorId: "creator-id",
			updaterId: null,
			createdAt: new Date(),
			updatedAt: null,
			userRegistrationRequired: false,
		});

		const createMockTransaction = (
			mockDeletedOrganization: ReturnType<typeof createMockDeletedOrganization>,
		) => {
			return async (callback: (tx: unknown) => Promise<unknown>) => {
				const mockTx = {
					delete: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							returning: vi.fn().mockResolvedValue([mockDeletedOrganization]),
						}),
					}),
				};
				return callback(mockTx as never);
			};
		};

		/** Transaction mock where delete matches zero rows (returning []), covering the "deleted === undefined" branch. */
		const createMockTransactionReturningNoRow = () => {
			return async (callback: (tx: unknown) => Promise<unknown>) => {
				const mockTx = {
					delete: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							returning: vi.fn().mockResolvedValue([]),
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
			const deleteOrganizationField =
				mutationType.getFields().deleteOrganization;
			if (!deleteOrganizationField) {
				throw new Error("deleteOrganization mutation field not found");
			}
			deleteOrganizationMutationResolver =
				deleteOrganizationField.resolve as typeof deleteOrganizationMutationResolver;
			if (!deleteOrganizationMutationResolver) {
				throw new Error("deleteOrganization mutation resolver not found");
			}
		});

		afterEach(() => {
			vi.useRealTimers();
			vi.clearAllMocks();
		});

		it("should record mutation:deleteOrganization in perf snapshot when resolver is invoked directly", async () => {
			vi.useRealTimers();
			try {
				const perf = createPerformanceTracker();
				const { context, mocks } = createMockGraphQLContext(true, "admin-user");
				context.perf = perf;

				const orgId = faker.string.uuid();
				const mockAdminUser = createMockAdminUser();
				const mockExistingOrganization = createMockExistingOrganization(orgId);
				const mockDeletedOrganization = createMockDeletedOrganization(orgId);

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
					.mockImplementation(createMockTransaction(mockDeletedOrganization));

				vi.spyOn(mocks.minioClient.client, "removeObjects").mockResolvedValue(
					[],
				);

				const result = await deleteOrganizationMutationResolver(
					null,
					{ input: { id: orgId } },
					context,
				);

				expect(result).toBeDefined();
				expect(result).toHaveProperty("id", orgId);

				const snapshot = perf.snapshot();
				const op = snapshot.ops["mutation:deleteOrganization"];
				expect(op).toBeDefined();
				expect(op?.count).toBe(1);
				expect(op?.ms).toBeGreaterThanOrEqual(0);
			} finally {
				vi.useFakeTimers();
			}
		});

		it("should succeed even when MinIO cleanup fails (best-effort)", async () => {
			vi.useRealTimers();
			try {
				const perf = createPerformanceTracker();
				const { context, mocks } = createMockGraphQLContext(true, "admin-user");
				context.perf = perf;

				const orgId = faker.string.uuid();
				const mockAdminUser = createMockAdminUser();
				const mockExistingOrganization = createMockExistingOrganization(orgId, {
					avatarName: "some-avatar.png",
				});
				const mockDeletedOrganization = createMockDeletedOrganization(orgId);

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
					.mockImplementation(createMockTransaction(mockDeletedOrganization));

				vi.spyOn(mocks.minioClient.client, "removeObjects").mockRejectedValue(
					new Error("MinIO unavailable error"),
				);

				const log = context.log;
				if (!log) {
					throw new Error(
						"context.log required for MinIO cleanup failure test",
					);
				}
				const logSpy = vi.spyOn(log, "error");

				const result = await deleteOrganizationMutationResolver(
					null,
					{ input: { id: orgId } },
					context,
				);

				expect(result).toHaveProperty("id", orgId);
				expect(logSpy).toHaveBeenCalledWith(
					expect.objectContaining({ err: expect.any(Error) }),
					expect.stringContaining("Failed to remove MinIO objects"),
				);
			} finally {
				vi.useFakeTimers();
			}
		});

		describe("Edge-case: currentUser === undefined path (deleteOrganization 118-124)", () => {
			it("should throw unauthenticated when usersTable.findFirst returns undefined (currentUser missing) and perf snapshot records the attempt", async () => {
				const perf = createPerformanceTracker();
				const { context, mocks } = createMockGraphQLContext(true, "admin-user");
				context.perf = perf;

				const orgId = faker.string.uuid();
				const mockExistingOrganization = createMockExistingOrganization(orgId);

				mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
					undefined,
				);
				mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
					mockExistingOrganization,
				);

				const resultPromise = deleteOrganizationMutationResolver(
					null,
					{ input: { id: orgId } },
					context,
				);

				await expect(resultPromise).rejects.toMatchObject({
					extensions: { code: "unauthenticated" },
				});

				const snapshot = perf.snapshot();
				const op = snapshot.ops["mutation:deleteOrganization"];
				expect(op).toBeDefined();
				expect(op?.count).toBe(1);
			});
		});

		describe("Edge-case: Delete race condition deleted === undefined (deleteOrganization 154-166)", () => {
			it("should throw arguments_associated_resources_not_found when delete returns no row (delete-race)", async () => {
				const { context, mocks } = createMockGraphQLContext(true, "admin-user");

				const orgId = faker.string.uuid();
				const mockAdminUser = createMockAdminUser();
				const mockExistingOrganization = createMockExistingOrganization(orgId);

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
					.mockImplementation(createMockTransactionReturningNoRow());

				const resultPromise = deleteOrganizationMutationResolver(
					null,
					{ input: { id: orgId } },
					context,
				);

				await expect(resultPromise).rejects.toMatchObject({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "id"] }],
					},
				});
			});
		});
	});
});
