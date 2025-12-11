import { asc, desc, eq } from "drizzle-orm";
import type {
	GraphQLFieldResolver,
	GraphQLObjectType,
	GraphQLResolveInfo,
} from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fundCampaignPledgesTable } from "~/src/drizzle/tables/fundCampaignPledges";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { FundCampaign as FundCampaignType } from "~/src/graphql/types/FundCampaign/FundCampaign";

type PledgesResolver = GraphQLFieldResolver<
	FundCampaignType,
	GraphQLContext,
	Record<string, unknown>,
	unknown
>;

describe("FundCampaign Resolver - pledges Field", () => {
	let mockFundCampaign: FundCampaignType;
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let pledgesResolver: PledgesResolver;

	const mockResolveInfo: GraphQLResolveInfo = {} as GraphQLResolveInfo;

	beforeAll(() => {
		const fundCampaignType = schema.getType(
			"FundCampaign",
		) as GraphQLObjectType;
		const pledgesField = fundCampaignType.getFields().pledges;
		if (!pledgesField) {
			throw new Error("pledges field not found on FundCampaign type");
		}
		pledgesResolver = pledgesField.resolve as PledgesResolver;
		if (!pledgesResolver) {
			throw new Error("pledges resolver not found on FundCampaign type");
		}
	});

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
		mockFundCampaign = {
			id: "campaign-456",
			name: "Test Campaign",
			goalAmount: 10000,
			currencyCode: "USD",
			startAt: new Date("2024-03-01T00:00:00Z"),
			endAt: new Date("2024-03-31T23:59:59Z"),
			fundId: "fund-123",
			createdAt: new Date("2024-02-01T00:00:00Z"),
			creatorId: "user-123",
			updatedAt: null,
			updaterId: null,
		} as FundCampaignType;
	});

	describe("Empty connection handling", () => {
		it("should return empty connection when no pledges exist", async () => {
			mocks.drizzleClient.query.fundCampaignPledgesTable.findMany.mockResolvedValue(
				[],
			);

			const result = (await pledgesResolver(
				mockFundCampaign,
				{ first: 5 },
				ctx,
				mockResolveInfo,
			)) as {
				edges: Array<unknown>;
				pageInfo: {
					hasNextPage: boolean;
					hasPreviousPage: boolean;
					startCursor: string | null;
					endCursor: string | null;
				};
			};

			expect(result).toBeDefined();
			expect(Array.isArray(result.edges)).toBe(true);
			expect(result.edges.length).toBe(0);
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
			expect(result.pageInfo.startCursor).toBeNull();
			expect(result.pageInfo.endCursor).toBeNull();
		});
	});

	describe("Cursor validation", () => {
		it("should throw invalid_arguments error when after cursor is not valid Base64", async () => {
			await expect(
				pledgesResolver(
					mockFundCampaign,
					{ first: 5, after: "not-a-valid-base64" },
					ctx,
					mockResolveInfo,
				),
			).rejects.toMatchObject({
				extensions: {
					code: "invalid_arguments",
					issues: [
						expect.objectContaining({
							argumentPath: ["after"],
							message: "Not a valid cursor.",
						}),
					],
				},
			});
		});

		it("should throw invalid_arguments error when before cursor is not valid Base64", async () => {
			await expect(
				pledgesResolver(
					mockFundCampaign,
					{ last: 5, before: "not-valid-base64" },
					ctx,
					mockResolveInfo,
				),
			).rejects.toMatchObject({
				extensions: {
					code: "invalid_arguments",
					issues: [
						expect.objectContaining({
							argumentPath: ["before"],
							message: "Not a valid cursor.",
						}),
					],
				},
			});
		});

		it("should throw invalid_arguments error when cursor contains invalid JSON", async () => {
			const invalidCursor = Buffer.from("not-json").toString("base64url");

			await expect(
				pledgesResolver(
					mockFundCampaign,
					{ first: 5, after: invalidCursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toMatchObject({
				extensions: {
					code: "invalid_arguments",
					issues: [
						expect.objectContaining({
							argumentPath: ["after"],
							message: "Not a valid cursor.",
						}),
					],
				},
			});
		});

		it("should throw invalid_arguments error when cursor has invalid schema", async () => {
			const invalidCursor = Buffer.from(
				JSON.stringify({ invalidField: "value" }),
			).toString("base64url");

			await expect(
				pledgesResolver(
					mockFundCampaign,
					{ first: 5, after: invalidCursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toMatchObject({
				extensions: {
					code: "invalid_arguments",
					issues: [
						expect.objectContaining({
							argumentPath: ["after"],
						}),
					],
				},
			});
		});
	});

	describe("Non-existent cursor resources", () => {
		it("should throw arguments_associated_resources_not_found when after cursor yields no pledges", async () => {
			const fakeCursor = Buffer.from(
				JSON.stringify({ id: "01952911-82da-793f-a5bf-98381d9aefc8" }),
			).toString("base64url");

			// Mock the exists() subquery - needs to return empty array to trigger the error
			const mockSelectChain = {
				from: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnValue([]),
			};
			mocks.drizzleClient.select = vi.fn().mockReturnValue(mockSelectChain);

			mocks.drizzleClient.query.fundCampaignPledgesTable.findMany.mockResolvedValue(
				[],
			);

			await expect(
				pledgesResolver(
					mockFundCampaign,
					{ first: 5, after: fakeCursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toMatchObject({
				extensions: {
					code: "arguments_associated_resources_not_found",
					issues: [expect.objectContaining({ argumentPath: ["after"] })],
				},
			});
		});

		it("should throw arguments_associated_resources_not_found when before cursor yields no pledges", async () => {
			const fakeCursor = Buffer.from(
				JSON.stringify({ id: "01952911-82da-793f-a5bf-98381d9aefc8" }),
			).toString("base64url");

			// Mock the exists() subquery
			const mockSelectChain = {
				from: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnValue([]),
			};
			mocks.drizzleClient.select = vi.fn().mockReturnValue(mockSelectChain);

			mocks.drizzleClient.query.fundCampaignPledgesTable.findMany.mockResolvedValue(
				[],
			);

			await expect(
				pledgesResolver(
					mockFundCampaign,
					{ last: 5, before: fakeCursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toMatchObject({
				extensions: {
					code: "arguments_associated_resources_not_found",
					issues: [expect.objectContaining({ argumentPath: ["before"] })],
				},
			});
		});
	});

	describe("Pagination", () => {
		it("should return pledges with forward pagination using first", async () => {
			const mockPledges = [
				{
					id: "pledge-1",
					amount: 1000,
					campaignId: "campaign-456",
					pledgerId: "user-1",
					createdAt: new Date("2024-03-05T10:00:00Z"),
					creatorId: "user-1",
					updatedAt: null,
					updaterId: null,
					note: null,
				},
				{
					id: "pledge-2",
					amount: 2000,
					campaignId: "campaign-456",
					pledgerId: "user-2",
					createdAt: new Date("2024-03-06T10:00:00Z"),
					creatorId: "user-2",
					updatedAt: null,
					updaterId: null,
					note: null,
				},
			];

			mocks.drizzleClient.query.fundCampaignPledgesTable.findMany.mockResolvedValue(
				mockPledges,
			);

			const result = (await pledgesResolver(
				mockFundCampaign,
				{ first: 5 },
				ctx,
				mockResolveInfo,
			)) as {
				edges: Array<{ cursor: string; node: { id: string } }>;
				pageInfo: {
					hasNextPage: boolean;
					hasPreviousPage: boolean;
					startCursor: string | null;
					endCursor: string | null;
				};
			};

			expect(result).toBeDefined();
			expect(result.edges.length).toBe(2);
			expect(result.edges[0]?.node.id).toBe("pledge-1");
			expect(result.edges[1]?.node.id).toBe("pledge-2");
			expect(result.pageInfo.startCursor).toBeDefined();
			expect(result.pageInfo.endCursor).toBeDefined();
		});

		it("should return pledges with backward pagination using last", async () => {
			const mockPledges = [
				{
					id: "pledge-1",
					amount: 1000,
					campaignId: "campaign-456",
					pledgerId: "user-1",
					createdAt: new Date("2024-03-05T10:00:00Z"),
					creatorId: "user-1",
					updatedAt: null,
					updaterId: null,
					note: null,
				},
			];

			mocks.drizzleClient.query.fundCampaignPledgesTable.findMany.mockResolvedValue(
				mockPledges,
			);

			const result = (await pledgesResolver(
				mockFundCampaign,
				{ last: 5 },
				ctx,
				mockResolveInfo,
			)) as {
				edges: Array<{ cursor: string; node: { id: string } }>;
				pageInfo: {
					hasNextPage: boolean;
					hasPreviousPage: boolean;
					startCursor: string | null;
					endCursor: string | null;
				};
			};

			expect(result).toBeDefined();
			expect(result.edges.length).toBe(1);
			expect(result.edges[0]?.node.id).toBe("pledge-1");
		});

		it("should return pledges with cursor-based pagination", async () => {
			// Mock finding pledges after a cursor
			const mockPledges = [
				{
					id: "01952911-82da-793f-a5bf-98381d9aefc9",
					amount: 3000,
					campaignId: "campaign-456",
					pledgerId: "user-3",
					createdAt: new Date("2024-03-07T10:00:00Z"),
					creatorId: "user-3",
					updatedAt: null,
					updaterId: null,
					note: null,
				},
			];

			const cursor = Buffer.from(
				JSON.stringify({ id: "01952911-82da-793f-a5bf-98381d9aefc8" }),
			).toString("base64url");

			// Mock the exists() subquery to validate cursor exists
			const mockSelectChain = {
				from: vi.fn().mockReturnThis(),
				where: vi
					.fn()
					.mockReturnValue([{ id: "01952911-82da-793f-a5bf-98381d9aefc8" }]),
			};
			mocks.drizzleClient.select = vi.fn().mockReturnValue(mockSelectChain);

			mocks.drizzleClient.query.fundCampaignPledgesTable.findMany.mockResolvedValue(
				mockPledges,
			);

			const result = (await pledgesResolver(
				mockFundCampaign,
				{ first: 5, after: cursor },
				ctx,
				mockResolveInfo,
			)) as {
				edges: Array<{ cursor: string; node: { id: string } }>;
			};

			expect(result).toBeDefined();
			expect(result.edges.length).toBe(1);
			expect(result.edges[0]?.node.id).toBe(
				"01952911-82da-793f-a5bf-98381d9aefc9",
			);
		});

		it("should return pledges with backward pagination using before cursor", async () => {
			const mockPledges = [
				{
					id: "01952911-82da-793f-a5bf-98381d9aefc7",
					amount: 1500,
					campaignId: "campaign-456",
					pledgerId: "user-earlier",
					createdAt: new Date("2024-03-04T10:00:00Z"),
					creatorId: "user-earlier",
					updatedAt: null,
					updaterId: null,
					note: null,
				},
			];

			const cursor = Buffer.from(
				JSON.stringify({ id: "01952911-82da-793f-a5bf-98381d9aefc8" }),
			).toString("base64url");

			// Mock the exists() subquery to validate cursor exists
			const mockSelectChain = {
				from: vi.fn().mockReturnThis(),
				where: vi
					.fn()
					.mockReturnValue([{ id: "01952911-82da-793f-a5bf-98381d9aefc8" }]),
			};
			mocks.drizzleClient.select = vi.fn().mockReturnValue(mockSelectChain);

			mocks.drizzleClient.query.fundCampaignPledgesTable.findMany.mockResolvedValue(
				mockPledges,
			);

			const result = (await pledgesResolver(
				mockFundCampaign,
				{ last: 5, before: cursor },
				ctx,
				mockResolveInfo,
			)) as {
				edges: Array<{ cursor: string; node: { id: string } }>;
			};

			expect(result).toBeDefined();
			expect(result.edges.length).toBe(1);
			expect(result.edges[0]?.node.id).toBe(
				"01952911-82da-793f-a5bf-98381d9aefc7",
			);
		});
	});

	describe("Complexity calculation", () => {
		let pledgesComplexityFunction: (args: Record<string, unknown>) => {
			field: number;
			multiplier: number;
		};

		beforeAll(() => {
			const fundCampaignType = schema.getType(
				"FundCampaign",
			) as GraphQLObjectType;
			const pledgesField = fundCampaignType.getFields().pledges;
			if (
				!pledgesField ||
				!pledgesField.extensions ||
				!pledgesField.extensions.complexity
			) {
				throw new Error(
					"Complexity function not found on FundCampaign.pledges field",
				);
			}
			pledgesComplexityFunction = pledgesField.extensions.complexity as (
				args: Record<string, unknown>,
			) => { field: number; multiplier: number };
		});

		it("should return correct complexity with first: 20", () => {
			const result = pledgesComplexityFunction({ first: 20 });
			expect(result).toBeDefined();
			expect(result.multiplier).toBe(20);
			expect(result.field).toBeDefined();
		});

		it("should return correct complexity with last: 15", () => {
			const result = pledgesComplexityFunction({ last: 15 });
			expect(result).toBeDefined();
			expect(result.multiplier).toBe(15);
			expect(result.field).toBeDefined();
		});

		it("should return complexity with fallback multiplier of 1 when no first or last", () => {
			const result = pledgesComplexityFunction({});
			expect(result).toBeDefined();
			expect(result.multiplier).toBe(1);
			expect(result.field).toBeDefined();
		});
	});

	describe("Database query construction", () => {
		it("should query with correct campaign ID filter", async () => {
			mocks.drizzleClient.query.fundCampaignPledgesTable.findMany.mockResolvedValue(
				[],
			);

			await pledgesResolver(
				mockFundCampaign,
				{ first: 5 },
				ctx,
				mockResolveInfo,
			);

			const calls = mocks.drizzleClient.query.fundCampaignPledgesTable.findMany
				.mock.calls as unknown as Array<
				[{ where: unknown; orderBy: unknown; limit: number }]
			>;
			const callArgs = calls[0]?.[0];

			// Verify the where clause filters by campaign ID
			const expectedWhere = eq(
				fundCampaignPledgesTable.campaignId,
				mockFundCampaign.id,
			);
			expect(callArgs?.where?.toString().trim()).toBe(
				expectedWhere.toString().trim(),
			);
		});

		it("should use descending order for forward pagination", async () => {
			mocks.drizzleClient.query.fundCampaignPledgesTable.findMany.mockResolvedValue(
				[],
			);

			await pledgesResolver(
				mockFundCampaign,
				{ first: 5 },
				ctx,
				mockResolveInfo,
			);

			const calls = mocks.drizzleClient.query.fundCampaignPledgesTable.findMany
				.mock.calls as unknown as Array<[{ orderBy: Array<unknown> }]>;
			const callArgs = calls[0]?.[0];

			// Verify descending order on id column for forward pagination
			const expectedOrderBy = [desc(fundCampaignPledgesTable.id)];
			expect(callArgs?.orderBy).toEqual(expectedOrderBy);
		});

		it("should use ascending order for backward pagination", async () => {
			mocks.drizzleClient.query.fundCampaignPledgesTable.findMany.mockResolvedValue(
				[],
			);

			await pledgesResolver(
				mockFundCampaign,
				{ last: 5 },
				ctx,
				mockResolveInfo,
			);

			const calls = mocks.drizzleClient.query.fundCampaignPledgesTable.findMany
				.mock.calls as unknown as Array<[{ orderBy: Array<unknown> }]>;
			const callArgs = calls[0]?.[0];

			// Verify ascending order on id column for backward pagination
			const expectedOrderBy = [asc(fundCampaignPledgesTable.id)];
			expect(callArgs?.orderBy).toEqual(expectedOrderBy);
		});
	});

	describe("Edge cases", () => {
		it("should handle reasonable number of pledges", async () => {
			// Use a smaller number to stay within pagination limits
			const pledgeList = Array.from({ length: 25 }, (_, i) => ({
				id: `pledge-${i}`,
				amount: 1000 * (i + 1),
				campaignId: "campaign-456",
				pledgerId: `user-${i}`,
				createdAt: new Date(
					`2024-03-${String((i % 28) + 1).padStart(2, "0")}T10:00:00Z`,
				),
				creatorId: `user-${i}`,
				updatedAt: null,
				updaterId: null,
				note: null,
			}));

			mocks.drizzleClient.query.fundCampaignPledgesTable.findMany.mockResolvedValue(
				pledgeList,
			);

			const result = (await pledgesResolver(
				mockFundCampaign,
				{ first: 25 },
				ctx,
				mockResolveInfo,
			)) as {
				edges: Array<{ node: { id: string } }>;
			};

			expect(result).toBeDefined();
			expect(result.edges.length).toBe(25);
			expect(result.edges[0]?.node.id).toBe("pledge-0");
			expect(result.edges[24]?.node.id).toBe("pledge-24");
		});

		it("should handle pledges with null optional fields", async () => {
			const mockPledges = [
				{
					id: "pledge-1",
					amount: 1000,
					campaignId: "campaign-456",
					pledgerId: "user-1",
					createdAt: new Date("2024-03-05T10:00:00Z"),
					creatorId: "user-1",
					updatedAt: null,
					updaterId: null,
					note: null,
				},
			];

			mocks.drizzleClient.query.fundCampaignPledgesTable.findMany.mockResolvedValue(
				mockPledges,
			);

			const result = (await pledgesResolver(
				mockFundCampaign,
				{ first: 5 },
				ctx,
				mockResolveInfo,
			)) as {
				edges: Array<{ node: { id: string } }>;
			};

			expect(result).toBeDefined();
			expect(result.edges.length).toBe(1);
		});
	});
});
