import type { GraphQLObjectType } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { Tag } from "~/src/graphql/types/Tag/Tag";
// Import the actual implementation to ensure it's loaded for coverage
import "~/src/graphql/types/Tag/updatedAt";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";

// Get the updatedAt resolver from the schema
const tagType = schema.getType("Tag");
if (!tagType || !("getFields" in tagType)) {
	throw new Error("Tag type not found or is not an object type");
}
const updatedAtField = (tagType as GraphQLObjectType).getFields().updatedAt;
// Guard: ensure the resolver exists and is callable
if (typeof updatedAtField?.resolve !== "function") {
	throw new Error("updatedAt field resolver is not a function");
}
const updatedAtResolver = updatedAtField.resolve as (
	parent: Tag,
	args: Record<string, never>,
	ctx: GraphQLContext,
) => Promise<unknown>;

describe("Tag.updatedAt field resolver - Unit tests", () => {
	let ctx: GraphQLContext;
	let mockTag: Tag;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		vi.clearAllMocks();
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user123",
		);
		ctx = context;
		mocks = newMocks;
		mockTag = {
			id: "tag-111",
			name: "Test Tag",
			organizationId: "org-123",
			folderId: "folder-123",
			createdAt: new Date("2024-01-01T00:00:00Z"),
			updatedAt: new Date("2024-01-15T10:30:00Z"),
			creatorId: "creator-123",
			updaterId: null,
		};
	});

	describe("Authentication checks", () => {
		it("should throw unauthenticated error when user is not authenticated", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(updatedAtResolver(mockTag, {}, ctx)).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});

		it("should throw unauthenticated error when currentUser is undefined (user not found in database)", async () => {
			const eqMock = vi.fn();
			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				(...funcArgs: unknown[]) => {
					const args = funcArgs[0] as {
						where?: (fields: unknown, operators: unknown) => void;
						with?: {
							organizationMembershipsWhereMember?: {
								where?: (fields: unknown, operators: unknown) => void;
							};
						};
					};

					// Execute the main where callback to ensure coverage
					if (args?.where) {
						const fields = { id: expect.anything() };
						const operators = { eq: eqMock };
						args.where(fields, operators);
					}

					// Execute nested where callback for organizationMembershipsWhereMember
					if (args?.with?.organizationMembershipsWhereMember?.where) {
						const fields = {
							organizationId: expect.anything(),
						};
						const operators = { eq: eqMock };
						args.with.organizationMembershipsWhereMember.where(
							fields,
							operators,
						);
					}

					return Promise.resolve(undefined);
				},
			);

			await expect(updatedAtResolver(mockTag, {}, ctx)).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
			expect(eqMock).toHaveBeenCalled();
			// Verify the resolver passed the correct userId and organizationId
			expect(eqMock.mock.calls.some(([, rhs]) => rhs === "user123")).toBe(true);
			expect(
				eqMock.mock.calls.some(([, rhs]) => rhs === mockTag.organizationId),
			).toBe(true);
		});
	});

	describe("Authorization checks", () => {
		it("should throw unauthorized_action when user is not admin and has no organization membership", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user123",
				role: "member",
				organizationMembershipsWhereMember: [],
			});

			await expect(updatedAtResolver(mockTag, {}, ctx)).rejects.toMatchObject({
				extensions: { code: "unauthorized_action" },
			});
		});

		it("should throw unauthorized_action when user is not admin and org membership role is not administrator", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user123",
				role: "member",
				organizationMembershipsWhereMember: [{ role: "member" }],
			});

			await expect(updatedAtResolver(mockTag, {}, ctx)).rejects.toMatchObject({
				extensions: { code: "unauthorized_action" },
			});
		});
	});

	describe("Successful resolution", () => {
		it("should return updatedAt when user is system administrator", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			});

			const result = await updatedAtResolver(mockTag, {}, ctx);

			expect(result).toEqual(mockTag.updatedAt);
		});

		it("should return updatedAt when user is organization administrator", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user123",
				role: "member",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			});

			const result = await updatedAtResolver(mockTag, {}, ctx);

			expect(result).toEqual(mockTag.updatedAt);
		});

		it("should return updatedAt when user is both system and organization administrator", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			});

			const result = await updatedAtResolver(mockTag, {}, ctx);

			expect(result).toEqual(mockTag.updatedAt);
		});
	});

	describe("Where clause coverage", () => {
		it("should execute usersTable where clause with correct parameters", async () => {
			const userEqMock = vi.fn();
			const membershipEqMock = vi.fn();
			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				(...funcArgs: unknown[]) => {
					const args = funcArgs[0] as {
						where?: (fields: unknown, operators: unknown) => void;
						with?: {
							organizationMembershipsWhereMember?: {
								where?: (fields: unknown, operators: unknown) => void;
							};
						};
					};

					// Execute the main where callback
					if (args?.where) {
						const fields = { id: "users.id" };
						const operators = { eq: userEqMock };
						args.where(fields, operators);
					}

					// Execute nested where callback for organizationMembershipsWhereMember
					if (args?.with?.organizationMembershipsWhereMember?.where) {
						const fields = {
							organizationId: "organizationMemberships.organizationId",
						};
						const operators = { eq: membershipEqMock };
						args.with.organizationMembershipsWhereMember.where(
							fields,
							operators,
						);
					}

					return Promise.resolve({
						id: "user123",
						role: "administrator",
						organizationMembershipsWhereMember: [],
					});
				},
			);

			await updatedAtResolver(mockTag, {}, ctx);

			// Make explicit that the query was invoked
			expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalled();

			expect(userEqMock.mock.calls.some(([, rhs]) => rhs === "user123")).toBe(
				true,
			);
			expect(
				membershipEqMock.mock.calls.some(
					([, rhs]) => rhs === mockTag.organizationId,
				),
			).toBe(true);
		});
	});
});
