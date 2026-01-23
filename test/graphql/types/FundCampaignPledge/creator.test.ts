import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveCreator } from "~/src/graphql/types/FundCampaignPledge/creator";
import type { FundCampaignPledge } from "~/src/graphql/types/FundCampaignPledge/FundCampaignPledge";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("FundCampaignPledge Resolver - Creator Field", () => {
	let ctx: GraphQLContext;
	let mockPledge: FundCampaignPledge;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(true, "123");
		ctx = context;
		mocks = newMocks;
		mockPledge = {
			id: "pledge-123",
			campaignId: "campaign-456",
			pledgerId: "pledger-789",
			creatorId: "creator-abc",
			amount: 1000,
			note: null,
			createdAt: new Date("2024-01-01T00:00:00Z"),
			updatedAt: new Date("2024-01-02T00:00:00Z"),
			updaterId: null,
		};

		vi.clearAllMocks();
	});

	it("should throw unauthenticated error when user is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(resolveCreator(mockPledge, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			}),
		);
	});

	it("should return null when creatorId is null", async () => {
		const pledgeWithNullCreator = {
			...mockPledge,
			creatorId: null,
		};

		const result = await resolveCreator(pledgeWithNullCreator, {}, ctx);
		expect(result).toBeNull();
	});

	it("should return creator user when creatorId is valid", async () => {
		const mockCreator = {
			id: "creator-abc",
			email: "creator@example.com",
			firstName: "John",
			lastName: "Doe",
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockCreator,
		);

		const result = await resolveCreator(mockPledge, {}, ctx);
		expect(result).toEqual(mockCreator);

		// Verify the database was queried
		expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalled();
	});

	it("should log error and return null when creator user is not found", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		const result = await resolveCreator(mockPledge, {}, ctx);
		expect(result).toBeNull();

		// Verify error was logged
		expect(ctx.log.error).toHaveBeenCalledWith(
			expect.stringContaining("No user found for creatorId"),
		);
	});

	it("should query usersTable with correct creatorId", async () => {
		const mockCreator = {
			id: "creator-abc",
			email: "creator@example.com",
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockCreator,
		);

		await resolveCreator(mockPledge, {}, ctx);

		// Verify that usersTable.findFirst was called
		expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalled();

		// Get the where function that was passed
		const callArgs = mocks.drizzleClient.query.usersTable.findFirst.mock
			.calls[0] as unknown as [
			{
				where: (
					fields: Record<string, unknown>,
					operators: Record<string, (...args: unknown[]) => unknown>,
				) => unknown;
			},
		];

		expect(callArgs).toBeDefined();
		expect(callArgs[0]).toBeDefined();
		const whereFunction = callArgs[0].where;

		// Create mock fields and operators to test the where function
		const mockFields: Record<string, unknown> = { id: "mockField" };
		const mockOperators = {
			eq: vi.fn((field: unknown, value: unknown) => ({ field, value })),
		};

		// Call the where function to see what it does
		whereFunction(mockFields, mockOperators);

		// Verify it was called with the correct creatorId
		expect(mockOperators.eq).toHaveBeenCalledWith(
			"mockField",
			mockPledge.creatorId,
		);
	});
});
