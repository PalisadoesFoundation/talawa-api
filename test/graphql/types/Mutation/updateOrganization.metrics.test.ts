import { Readable } from "node:stream";
import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
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
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { schema } from "~/src/graphql/schema";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_deleteOrganization,
	Mutation_updateOrganization,
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

let authToken: string;

describe("Mutation updateOrganization - Performance Tracking", () => {
	beforeAll(async () => {
		const { accessToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(accessToken);
		authToken = accessToken;
	});

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
			expect(
				result.errors?.some(
					(e) =>
						e.path?.[0] === "updateOrganization" &&
						e.extensions?.code === "invalid_arguments",
				),
			).toBe(true);
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

		describe("Edge-case: Duplicate name validation (updateOrganization 145-172)", () => {
			it('should return invalid_arguments with issue on ["input","name"] when another org has the same name', async () => {
				const duplicateName = `Dup Name ${faker.string.ulid()}`;
				const org1Id = await createTestOrganization(authToken);
				const org2Id = await createTestOrganization(authToken);

				await mercuriusClient.mutate(Mutation_updateOrganization, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: { id: org1Id, name: duplicateName },
					},
				});

				// Update org2 to org1's name (duplicate)
				const result = await mercuriusClient.mutate(
					Mutation_updateOrganization,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: { id: org2Id, name: duplicateName },
						},
					},
				);

				expect(result.data?.updateOrganization).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							message: "Organization name already exists",
							extensions: expect.objectContaining({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "name"],
										message: "Organization name already exists",
									}),
								]),
							}),
							path: ["updateOrganization"],
						}),
					]),
				);

				// Cleanup
				for (const id of [org1Id, org2Id]) {
					const del = await mercuriusClient.mutate(
						Mutation_deleteOrganization,
						{
							headers: { authorization: `bearer ${authToken}` },
							variables: { input: { id } },
						},
					);
					expect(del.errors).toBeUndefined();
					expect(del.data?.deleteOrganization?.id).toBe(id);
				}
			});
		});

		describe("Edge-case: Avatar upload/update/removal scenarios (updateOrganization 231-249)", () => {
			it("should remove avatar (MinIO and DB) when avatar is set to null and org had avatar", async () => {
				const orgId = await createTestOrganization(authToken);

				await (server as FastifyInstance).drizzleClient
					.update(organizationsTable)
					.set({
						avatarName: "test-avatar-remove.png",
						avatarMimeType: "image/png",
					})
					.where(eq(organizationsTable.id, orgId));

				const result = await mercuriusClient.mutate(
					Mutation_updateOrganization,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: { id: orgId, avatar: null },
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateOrganization?.avatarMimeType).toBeNull();

				const updatedOrg = await (
					server as FastifyInstance
				).drizzleClient.query.organizationsTable.findFirst({
					where: eq(organizationsTable.id, orgId),
					columns: { avatarName: true, avatarMimeType: true },
				});
				expect(updatedOrg?.avatarName).toBeNull();
				expect(updatedOrg?.avatarMimeType).toBeNull();

				const deleteResult = await mercuriusClient.mutate(
					Mutation_deleteOrganization,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: { input: { id: orgId } },
					},
				);
				expect(deleteResult.errors).toBeUndefined();
				expect(deleteResult.data?.deleteOrganization?.id).toBe(orgId);
			});

			it('should return invalid_arguments with issue on ["input","avatar"] when avatar mimetype is not allowed (e.g. text/plain)', async () => {
				const orgId = await createTestOrganization(authToken);
				const invalidAvatarUpload = Promise.resolve({
					filename: "avatar.txt",
					mimetype: "text/plain",
					createReadStream: () => Readable.from("dummy"),
				});

				const result = await mercuriusClient.mutate(
					Mutation_updateOrganization,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								id: orgId,
								avatar: invalidAvatarUpload,
							},
						},
					},
				);

				expect(result.data?.updateOrganization ?? null).toBeNull();
				expect(result.errors?.length).toBeGreaterThan(0);
				// Invalid avatar MIME may be rejected by GraphQL layer ("Graphql validation error")
				// or by the resolver (invalid_arguments with issue on avatar).
				const issues =
					result.errors?.flatMap((e) =>
						Array.isArray(e.extensions?.issues) ? e.extensions.issues : [],
					) ?? [];
				const hasResolverError =
					result.errors?.some(
						(e) => e.extensions?.code === "invalid_arguments",
					) &&
					issues.some(
						(issue: { argumentPath?: unknown }) =>
							Array.isArray(issue.argumentPath) &&
							(issue.argumentPath as string[]).includes("avatar"),
					);
				const hasGraphqlValidationError = result.errors?.some((e) =>
					/mime type.*not allowed|graphql validation error/i.test(
						e.message ?? "",
					),
				);
				expect(hasResolverError || hasGraphqlValidationError).toBe(true);

				// Cleanup: delete org so DB/MinIO state remains consistent
				const deleteResult = await mercuriusClient.mutate(
					Mutation_deleteOrganization,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: { input: { id: orgId } },
					},
				);
				expect(deleteResult.errors).toBeUndefined();
				expect(deleteResult.data?.deleteOrganization?.id).toBe(orgId);
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

		/** Transaction mock where update matches zero rows (returning []), covering the "updated === undefined" branch. */
		const createMockTransactionReturningNoRow = () => {
			return async (callback: (tx: unknown) => Promise<unknown>) => {
				const mockTx = {
					update: vi.fn().mockReturnValue({
						set: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								returning: vi.fn().mockResolvedValue([]),
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
			// Use real timers to avoid infinite loop from runAllTimersAsync (mocks/context can schedule recurring timers)
			vi.useRealTimers();
			try {
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

				const result = await updateOrganizationMutationResolver(
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
			} finally {
				vi.useFakeTimers();
			}
		});

		it("should throw arguments_associated_resources_not_found when update returns no row (e.g. row deleted in race)", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");

			const orgId = faker.string.uuid();
			const orgName = `Updated Org ${faker.string.ulid()}`;
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

			await expect(resultPromise).rejects.toMatchObject({
				extensions: {
					code: "arguments_associated_resources_not_found",
					issues: [{ argumentPath: ["input", "id"] }],
				},
			});
		});

		it("should throw unauthenticated when usersTable.findFirst returns undefined (currentUser === undefined branch)", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			const orgId = faker.string.uuid();
			const mockExistingOrganization = createMockExistingOrganization(orgId);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				undefined,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockExistingOrganization,
			);

			const resultPromise = updateOrganizationMutationResolver(
				null,
				{
					input: {
						id: orgId,
						name: "Updated Name",
					},
				},
				context,
			);

			await expect(resultPromise).rejects.toThrow(TalawaGraphQLError);
			await expect(resultPromise).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});

		it('should throw invalid_arguments with issue ["input","name"] when another org has the same name (duplicate name branch)', async () => {
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");

			const orgId = faker.string.uuid();
			const otherOrgId = faker.string.uuid();
			const duplicateName = `Duplicate Name ${faker.string.ulid()}`;
			const mockAdminUser = createMockAdminUser();
			const mockExistingOrganization = createMockExistingOrganization(orgId);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockAdminUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockExistingOrganization,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				{ id: otherOrgId },
			);

			const resultPromise = updateOrganizationMutationResolver(
				null,
				{
					input: {
						id: orgId,
						name: duplicateName,
					},
				},
				context,
			);

			await expect(resultPromise).rejects.toThrow(TalawaGraphQLError);
			await expect(resultPromise).rejects.toMatchObject({
				message: "Organization name already exists",
				extensions: {
					code: "invalid_arguments",
					issues: [
						{
							argumentPath: ["input", "name"],
							message: "Organization name already exists",
						},
					],
				},
			});
		});

		it("should call MinIO removeObject when avatar is null and org had avatar (avatar remove branch)", async () => {
			vi.useRealTimers();
			try {
				const { context, mocks } = createMockGraphQLContext(true, "admin-user");
				const orgId = faker.string.uuid();
				const existingAvatarName = "existing-avatar.png";
				const mockAdminUser = createMockAdminUser();
				const mockExistingOrganization = createMockExistingOrganization(
					orgId,
					existingAvatarName,
				);
				const mockUpdatedOrganization = createMockUpdatedOrganization(
					orgId,
					"Org",
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

				await updateOrganizationMutationResolver(
					null,
					{
						input: {
							id: orgId,
							avatar: null,
						},
					},
					context,
				);

				expect(mocks.minioClient.client.removeObject).toHaveBeenCalledWith(
					mocks.minioClient.bucketName,
					existingAvatarName,
				);
			} finally {
				vi.useFakeTimers();
			}
		});

		it("should call MinIO putObject when avatar is provided (avatar add branch)", async () => {
			vi.useRealTimers();
			try {
				const { context, mocks } = createMockGraphQLContext(true, "admin-user");
				const orgId = faker.string.uuid();
				const mockAdminUser = createMockAdminUser();
				const mockExistingOrganization = createMockExistingOrganization(
					orgId,
					null,
				);
				const mockUpdatedOrganization = createMockUpdatedOrganization(
					orgId,
					"Org",
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

				const createMockReadStream = () => ({
					pipe: vi.fn().mockReturnThis(),
					on: vi.fn().mockReturnThis(),
				});
				const mockAvatar = Promise.resolve({
					mimetype: "image/png" as const,
					createReadStream: vi.fn().mockReturnValue(createMockReadStream()),
				});

				await updateOrganizationMutationResolver(
					null,
					{
						input: {
							id: orgId,
							name: "Org With Avatar",
							avatar: mockAvatar,
						},
					},
					context,
				);

				expect(mocks.minioClient.client.putObject).toHaveBeenCalledWith(
					mocks.minioClient.bucketName,
					expect.any(String),
					expect.anything(),
					undefined,
					expect.objectContaining({ "content-type": "image/png" }),
				);
			} finally {
				vi.useFakeTimers();
			}
		});

		it("should execute mutation successfully without recording perf when context.perf is undefined", async () => {
			// Use real timers for this test to avoid infinite loop from runAllTimersAsync
			// (mocks/context can schedule recurring timers)
			vi.useRealTimers();
			try {
				const { context, mocks } = createMockGraphQLContext(true, "admin-user");
				context.perf = undefined;

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

				const result = await updateOrganizationMutationResolver(
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

				expect(result).toBeDefined();
				expect(result).toMatchObject({
					id: orgId,
					name: orgName,
					description: "Updated Description",
				});
			} finally {
				vi.useFakeTimers();
			}
		});
	});
});
