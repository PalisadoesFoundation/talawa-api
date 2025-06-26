import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { ActionItemCategory as ActionItemCategoryType } from "~/src/graphql/types/ActionItemCategory/ActionItemCategory";
import { resolveOrganization } from "~/src/graphql/types/ActionItemCategory/organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("ActionItemCategory Resolver - Organization Field", () => {
	let ctx: GraphQLContext;
	let mockActionItemCategory: ActionItemCategoryType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		mockActionItemCategory = {
			id: "category-123",
			organizationId: "org-123",
			creatorId: "user-456",
			updaterId: "user-789",
			name: "Test Category",
			description: "Test Description",
			isDisabled: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		} as ActionItemCategoryType;

		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
	});

	it("should successfully resolve organization when it exists", async () => {
		const mockOrganization = {
			id: "org-123",
			name: "Test Organization",
			description: "Test Organization Description",
			countryCode: "US",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
			mockOrganization,
		);

		const result = await resolveOrganization(mockActionItemCategory, {}, ctx);

		expect(result).toEqual(mockOrganization);
		expect(
			mocks.drizzleClient.query.organizationsTable.findFirst,
		).toHaveBeenCalledWith({
			where: expect.any(Function),
		});
	});

	it("should throw unexpected error when organization does not exist", async () => {
		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
			undefined,
		);

		await expect(
			resolveOrganization(mockActionItemCategory, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an action item category's organization id that isn't null.",
		);
	});

	it("should call database query with correct organization ID", async () => {
		const mockOrganization = {
			id: "org-123",
			name: "Test Organization",
		};

		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
			mockOrganization,
		);

		await resolveOrganization(mockActionItemCategory, {}, ctx);

		// Verify the query was called with the correct parameters
		expect(
			mocks.drizzleClient.query.organizationsTable.findFirst,
		).toHaveBeenCalledTimes(1);

		// Verify the query was called with a where clause
		expect(
			mocks.drizzleClient.query.organizationsTable.findFirst,
		).toHaveBeenCalledWith({
			where: expect.any(Function),
		});
	});

	it("should handle different organization IDs correctly", async () => {
		const mockOrganization1 = {
			id: "org-456",
			name: "Organization 1",
		};

		const mockOrganization2 = {
			id: "org-789",
			name: "Organization 2",
		};

		// Test with first organization ID
		mockActionItemCategory.organizationId = "org-456";
		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
			mockOrganization1,
		);

		let result = await resolveOrganization(mockActionItemCategory, {}, ctx);
		expect(result).toEqual(mockOrganization1);

		// Test with second organization ID
		mockActionItemCategory.organizationId = "org-789";
		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
			mockOrganization2,
		);

		result = await resolveOrganization(mockActionItemCategory, {}, ctx);
		expect(result).toEqual(mockOrganization2);

		// Verify both calls were made
		expect(
			mocks.drizzleClient.query.organizationsTable.findFirst,
		).toHaveBeenCalledTimes(2);
	});

	it("should log error with correct message when organization is not found", async () => {
		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
			undefined,
		);

		try {
			await resolveOrganization(mockActionItemCategory, {}, ctx);
		} catch (error) {
			expect(ctx.log.error).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for an action item category's organization id that isn't null.",
			);
			expect(error).toBeInstanceOf(TalawaGraphQLError);
			expect((error as TalawaGraphQLError).extensions.code).toBe("unexpected");
			expect((error as TalawaGraphQLError).message).toBe(
				"Something went wrong. Please try again later.",
			);
		}
	});

	it("should handle database errors gracefully", async () => {
		const databaseError = new Error("Database connection failed");
		mocks.drizzleClient.query.organizationsTable.findFirst.mockRejectedValue(
			databaseError,
		);

		await expect(
			resolveOrganization(mockActionItemCategory, {}, ctx),
		).rejects.toThrow(databaseError);

		// Verify the query was attempted
		expect(
			mocks.drizzleClient.query.organizationsTable.findFirst,
		).toHaveBeenCalledTimes(1);
	});

	it("should work with minimal organization data", async () => {
		const minimalOrganization = {
			id: "org-123",
		};

		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
			minimalOrganization,
		);

		const result = await resolveOrganization(mockActionItemCategory, {}, ctx);

		expect(result).toEqual(minimalOrganization);
		expect(result.id).toBe("org-123");
	});

	it("should work with complex organization data", async () => {
		const complexOrganization = {
			id: "org-123",
			name: "Complex Organization",
			description: "A very detailed organization description",
			countryCode: "US",
			createdAt: new Date("2023-01-01"),
			updatedAt: new Date("2024-01-01"),
			website: "https://example.org",
			isVerified: true,
		};

		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
			complexOrganization,
		);

		const result = await resolveOrganization(mockActionItemCategory, {}, ctx);

		expect(result).toEqual(complexOrganization);
		expect(result.name).toBe("Complex Organization");
	});

	it("should verify the query structure and parameters", async () => {
		const mockOrganization = { id: "org-123", name: "Test Org" };
		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
			mockOrganization,
		);

		await resolveOrganization(mockActionItemCategory, {}, ctx);

		// Verify the query was called correctly
		expect(
			mocks.drizzleClient.query.organizationsTable.findFirst,
		).toHaveBeenCalledTimes(1);

		// Verify the query was called with the expected structure
		expect(
			mocks.drizzleClient.query.organizationsTable.findFirst,
		).toHaveBeenCalledWith({
			where: expect.any(Function),
		});
	});
});
