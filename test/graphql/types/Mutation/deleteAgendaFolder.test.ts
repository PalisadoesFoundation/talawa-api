import type { GraphQLFieldMap, GraphQLObjectType } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
// Import the actual implementation to ensure it's loaded for coverage
import "~/src/graphql/types/Mutation/deleteAgendaFolder";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { uuidv7 } from "uuidv7";

// Get the deleteAgendaFolder resolver from the schema
const mutationType = schema.getType("Mutation") as GraphQLObjectType;
const deleteAgendaFolderField = (
	mutationType.getFields() as GraphQLFieldMap<unknown, GraphQLContext>
).deleteAgendaFolder;

if (!deleteAgendaFolderField) {
	throw new Error("deleteAgendaFolder field not found on Mutation type");
}

const deleteAgendaFolderResolver = deleteAgendaFolderField.resolve as (
	parent: unknown,
	args: { input: { id: string } },
	ctx: GraphQLContext,
) => Promise<unknown>;

describe("Mutation.deleteAgendaFolder field resolver - Unit tests", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let testFolderId: string;

	beforeEach(() => {
		vi.clearAllMocks();
		testFolderId = uuidv7();
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user123",
		);
		ctx = context;
		mocks = newMocks;
	});

	describe("Authentication checks", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const { context: unauthCtx } = createMockGraphQLContext(false, undefined);

			await expect(
				deleteAgendaFolderResolver(
					{},
					{ input: { id: testFolderId } },
					unauthCtx,
				),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});

		it("should throw unauthenticated error when user is not found in database", async () => {
			// Mock Promise.all with two queries
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);
			mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
				id: testFolderId,
				isAgendaItemFolder: true,
				event: {
					startAt: new Date(),
					organization: {
						countryCode: "US",
						membershipsWhereOrganization: [],
					},
				},
			});

			await expect(
				deleteAgendaFolderResolver(
					{},
					{ input: { id: testFolderId } },
					ctx,
				),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});

			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});
	});

	describe("Input validation", () => {
		it("should throw invalid_arguments error for invalid input id format", async () => {
			await expect(
				deleteAgendaFolderResolver(
					{},
					{ input: { id: "invalid-id" } },
					ctx,
				),
			).rejects.toMatchObject({
				extensions: {
					code: "invalid_arguments",
					issues: expect.arrayContaining([
						expect.objectContaining({
							argumentPath: ["input", "id"],
							message: expect.any(String),
						}),
					]),
				},
			});
		});
	});

	describe("Resource existence checks", () => {
		it("should throw arguments_associated_resources_not_found error when agenda folder does not exist", async () => {
			// Mock user exists
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});

			// Mock agenda folder not found
			mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				deleteAgendaFolderResolver(
					{},
					{ input: { id: testFolderId } },
					ctx,
				),
			).rejects.toMatchObject({
				extensions: {
					code: "arguments_associated_resources_not_found",
					issues: expect.arrayContaining([
						expect.objectContaining({
							argumentPath: ["input", "id"],
						}),
					]),
				},
			});
		});
	});

	describe("Authorization checks", () => {
		it("should throw unauthorized_action_on_arguments_associated_resources error when user is regular and not an organization admin", async () => {
			// Mock user as regular
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});

			// Mock existing agenda folder with no admin membership
			mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
				id: testFolderId,
				isAgendaItemFolder: true,
				event: {
					startAt: new Date(),
					organization: {
						countryCode: "US",
						membershipsWhereOrganization: [], // No membership or non-admin membership
					},
				},
			});

			await expect(
				deleteAgendaFolderResolver(
					{},
					{ input: { id: testFolderId } },
					ctx,
				),
			).rejects.toMatchObject({
				extensions: {
					code: "unauthorized_action_on_arguments_associated_resources",
					issues: expect.arrayContaining([
						expect.objectContaining({
							argumentPath: ["input", "id"],
						}),
					]),
				},
			});
		});

		it("should throw unauthorized_action_on_arguments_associated_resources error when user is regular member but not admin", async () => {
			// Mock user as regular
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});

			// Mock existing agenda folder with regular membership
			mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
				id: testFolderId,
				isAgendaItemFolder: true,
				event: {
					startAt: new Date(),
					organization: {
						countryCode: "US",
						membershipsWhereOrganization: [
							{
								role: "regular", // Regular role, not administrator
							},
						],
					},
				},
			});

			await expect(
				deleteAgendaFolderResolver(
					{},
					{ input: { id: testFolderId } },
					ctx,
				),
			).rejects.toMatchObject({
				extensions: {
					code: "unauthorized_action_on_arguments_associated_resources",
					issues: expect.arrayContaining([
						expect.objectContaining({
							argumentPath: ["input", "id"],
						}),
					]),
				},
			});
		});

		it("should allow super admin to delete folder without organization membership", async () => {
			// Mock user as super admin
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});

			// Mock existing agenda folder without admin membership
			mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
				id: testFolderId,
				isAgendaItemFolder: true,
				event: {
					startAt: new Date(),
					organization: {
						countryCode: "US",
						membershipsWhereOrganization: [], // No membership
					},
				},
			});

			const deletedFolder = {
				id: testFolderId,
				name: "Test Folder",
				isAgendaItemFolder: true,
				eventId: "event-123",
				parentFolderId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			// Mock delete operation
			mocks.drizzleClient.delete.mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([deletedFolder]),
				}),
			} as never);

			const result = await deleteAgendaFolderResolver(
				{},
				{ input: { id: testFolderId } },
				ctx,
			);

			expect(result).toEqual(deletedFolder);
			expect(mocks.drizzleClient.delete).toHaveBeenCalledTimes(1);
		});

		it("should allow organization admin to delete folder", async () => {
			// Mock user as regular
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});

			// Mock existing agenda folder with admin membership
			mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
				id: testFolderId,
				isAgendaItemFolder: true,
				event: {
					startAt: new Date(),
					organization: {
						countryCode: "US",
						membershipsWhereOrganization: [
							{
								role: "administrator", // Organization administrator
							},
						],
					},
				},
			});

			const deletedFolder = {
				id: testFolderId,
				name: "Test Folder",
				isAgendaItemFolder: true,
				eventId: "event-123",
				parentFolderId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			// Mock delete operation
			mocks.drizzleClient.delete.mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([deletedFolder]),
				}),
			} as never);

			const result = await deleteAgendaFolderResolver(
				{},
				{ input: { id: testFolderId } },
				ctx,
			);

			expect(result).toEqual(deletedFolder);
			expect(mocks.drizzleClient.delete).toHaveBeenCalledTimes(1);
		});
	});

	describe("Successful deletion", () => {
		it("should successfully delete agenda folder and return the deleted folder", async () => {
			// Mock user as super admin
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});

			// Mock existing agenda folder
			mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
				id: testFolderId,
				isAgendaItemFolder: true,
				event: {
					startAt: new Date(),
					organization: {
						countryCode: "US",
						membershipsWhereOrganization: [],
					},
				},
			});

			const deletedFolder = {
				id: testFolderId,
				name: "Test Folder",
				isAgendaItemFolder: true,
				eventId: "event-123",
				parentFolderId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			// Mock delete operation
			mocks.drizzleClient.delete.mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([deletedFolder]),
				}),
			} as never);

			const result = await deleteAgendaFolderResolver(
				{},
				{ input: { id: testFolderId } },
				ctx,
			);

			expect(result).toEqual(deletedFolder);
			expect(mocks.drizzleClient.delete).toHaveBeenCalledTimes(1);
		});

		it("should successfully delete agenda folder with parentFolderId", async () => {
			// Mock user as super admin
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});

			// Mock existing agenda folder
			mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
				id: testFolderId,
				isAgendaItemFolder: false,
				event: {
					startAt: new Date(),
					organization: {
						countryCode: "US",
						membershipsWhereOrganization: [],
					},
				},
			});

			const deletedFolder = {
				id: testFolderId,
				name: "Child Folder",
				isAgendaItemFolder: false,
				eventId: "event-123",
				parentFolderId: "parent-folder-123",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			// Mock delete operation
			mocks.drizzleClient.delete.mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([deletedFolder]),
				}),
			} as never);

			const result = await deleteAgendaFolderResolver(
				{},
				{ input: { id: testFolderId } },
				ctx,
			);

			expect(result).toEqual(deletedFolder);
			expect(mocks.drizzleClient.delete).toHaveBeenCalledTimes(1);
		});
	});

	describe("Edge cases", () => {
		it("should throw unexpected error when delete operation returns undefined", async () => {
			// Mock user as super admin
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});

			// Mock existing agenda folder
			mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
				id: testFolderId,
				isAgendaItemFolder: true,
				event: {
					startAt: new Date(),
					organization: {
						countryCode: "US",
						membershipsWhereOrganization: [],
					},
				},
			});

			// Mock delete operation returning empty array (deleted by external entity)
			mocks.drizzleClient.delete.mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([]),
				}),
			} as never);

			await expect(
				deleteAgendaFolderResolver(
					{},
					{ input: { id: testFolderId } },
					ctx,
				),
			).rejects.toMatchObject({
				extensions: { code: "unexpected" },
			});
		});
	});

	describe("Where clause coverage", () => {
		it("should execute usersTable where clause with correct userId", async () => {
			const eqMock = vi.fn();

			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				(...funcArgs: unknown[]) => {
					const args = funcArgs[0] as {
						where?: (fields: unknown, operators: unknown) => void;
					};

					if (args?.where) {
						const fields = { id: "users.id" };
						const operators = { eq: eqMock };
						args.where(fields, operators);
					}

					return Promise.resolve({
						role: "administrator",
					});
				},
			);

			mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
				id: testFolderId,
				isAgendaItemFolder: true,
				event: {
					startAt: new Date(),
					organization: {
						countryCode: "US",
						membershipsWhereOrganization: [],
					},
				},
			});

			const deletedFolder = {
				id: testFolderId,
				name: "Test Folder",
				isAgendaItemFolder: true,
				eventId: "event-123",
				parentFolderId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mocks.drizzleClient.delete.mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([deletedFolder]),
				}),
			} as never);

			await deleteAgendaFolderResolver(
				{},
				{ input: { id: testFolderId } },
				ctx,
			);

			expect(eqMock).toHaveBeenCalledWith("users.id", "user123");
		});

		it("should execute agendaFoldersTable where clause with correct folderId", async () => {
			const eqMock = vi.fn();

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});

			mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockImplementation(
				(...funcArgs: unknown[]) => {
					const args = funcArgs[0] as {
						where?: (fields: unknown, operators: unknown) => void;
					};

					if (args?.where) {
						const fields = { id: "agendaFolders.id" };
						const operators = { eq: eqMock };
						args.where(fields, operators);
					}

					return Promise.resolve({
						id: testFolderId,
						isAgendaItemFolder: true,
						event: {
							startAt: new Date(),
							organization: {
								countryCode: "US",
								membershipsWhereOrganization: [],
							},
						},
					});
				},
			);

			const deletedFolder = {
				id: testFolderId,
				name: "Test Folder",
				isAgendaItemFolder: true,
				eventId: "event-123",
				parentFolderId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mocks.drizzleClient.delete.mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([deletedFolder]),
				}),
			} as never);

			await deleteAgendaFolderResolver(
				{},
				{ input: { id: testFolderId } },
				ctx,
			);

			expect(eqMock).toHaveBeenCalledWith(
				"agendaFolders.id",
				testFolderId,
			);
		});

		it("should execute membershipsWhereOrganization where clause with correct memberId", async () => {
			const memberEqMock = vi.fn();

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});

			mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockImplementation(
				(...funcArgs: unknown[]) => {
					const args = funcArgs[0] as {
						with?: {
							event?: {
								with?: {
									organization?: {
										with?: {
											membershipsWhereOrganization?: {
												where?: (fields: unknown, operators: unknown) => void;
											};
										};
									};
								};
							};
						};
					};

					// Execute the where callback for memberships
					if (
						args?.with?.event?.with?.organization?.with
							?.membershipsWhereOrganization?.where
					) {
						const fields = { memberId: "memberships.memberId" };
						const operators = { eq: memberEqMock };
						args.with.event.with.organization.with.membershipsWhereOrganization.where(
							fields,
							operators,
						);
					}

					return Promise.resolve({
						id: testFolderId,
						isAgendaItemFolder: true,
						event: {
							startAt: new Date(),
							organization: {
								countryCode: "US",
								membershipsWhereOrganization: [
									{
										role: "administrator",
									},
								],
							},
						},
					});
				},
			);

			const deletedFolder = {
				id: testFolderId,
				name: "Test Folder",
				isAgendaItemFolder: true,
				eventId: "event-123",
				parentFolderId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mocks.drizzleClient.delete.mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([deletedFolder]),
				}),
			} as never);

			await deleteAgendaFolderResolver(
				{},
				{ input: { id: testFolderId } },
				ctx,
			);

			expect(memberEqMock).toHaveBeenCalledWith(
				"memberships.memberId",
				"user123",
			);
		});
	});
});
