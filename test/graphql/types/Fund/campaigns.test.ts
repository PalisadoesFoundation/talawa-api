import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { describe, expect, it } from "vitest";
import "~/src/graphql/types/Fund/campaigns";

describe("FundCampaignPledge Resolver - Campaigns Field", () => {
    
    it("should successfully retrieve a list of campaigns", async () => {
        const { context, mocks } = createMockGraphQLContext(true, "user123");

        const fund = {
            id: "fund123",
            name: "School Fund",
        };

        const mockCampaigns = [
            {
                id: "campaign1",
                name: "Buy Books",
                fundId: "fund123",
                goalAmount: 5000,
            },
            {
                id: "campaign2",
                name: "Buy Computers",
                fundId: "fund123",
                goalAmount: 10000,
            },
        ];

        mocks.drizzleClient.query.fundCampaignsTable.findMany.mockResolvedValue(
            mockCampaigns,
        );

        const result = await context.drizzleClient.query.fundCampaignsTable.findMany({
            where: { fundId: fund.id },
            limit: 10,
        });

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe("Buy Books");
        expect(result[1].name).toBe("Buy Computers");
    });

    it("should throw an invalid_arguments error when provided with a malformed cursor", async () => {
        const { context } = createMockGraphQLContext(true, "user123");
        
        const builder = await import("~/src/graphql/builder");
        const typeConfig = builder.builder.configStore.typeConfigs.get("Fund");
        const pothosOptions = typeConfig?.pothosOptions as any;
        const mockSchemaBuilder = { connection: (config: any) => config };
        const fields = pothosOptions?.fields?.(mockSchemaBuilder);
        const campaignsResolver = fields?.campaigns?.resolve;

        const fund = {
            id: "fund123",
            name: "School Fund",
        };

        const invalidArguments = {
            first: 10,
            after: "this-is-not-a-valid-cursor-123",
        };

        await expect(
            campaignsResolver(fund, invalidArguments, context)
        ).rejects.toThrow();

        try {
            await campaignsResolver(fund, invalidArguments, context);
        } catch (error: any) {
            expect(error.extensions?.code).toBe("invalid_arguments");
        }
    });

    it("should return a valid connection structure when querying with valid arguments", async () => {
        const { context, mocks } = createMockGraphQLContext(true, "user123");
        
        const builder = await import("~/src/graphql/builder");
        const typeConfig = builder.builder.configStore.typeConfigs.get("Fund");
        const pothosOptions = typeConfig?.pothosOptions as any;
        const mockSchemaBuilder = { connection: (config: any) => config };
        const fields = pothosOptions?.fields?.(mockSchemaBuilder);
        const campaignsResolver = fields?.campaigns?.resolve;

        const fund = {
            id: "fund123",
            name: "School Fund",
        };

        const mockCampaigns = [
            {
                id: "campaign1",
                name: "Buy Books",
                fundId: "fund123",
                goalAmount: 5000,
            },
            {
                id: "campaign2",
                name: "Buy Computers",
                fundId: "fund123",
                goalAmount: 10000,
            },
        ];

        mocks.drizzleClient.query.fundCampaignsTable.findMany.mockResolvedValue(
            mockCampaigns,
        );

        const validArgs = {
            first: 10,
        };

        const result = await campaignsResolver(fund, validArgs, context);

        expect(result.edges).toHaveLength(2);
        expect(result.edges[0].node.name).toBe("Buy Books");
        expect(result.edges[1].node.name).toBe("Buy Computers");
        expect(result.pageInfo).toBeDefined();
        expect(result.pageInfo.hasNextPage).toBeDefined();
    });

    it("should throw 'arguments_associated_resources_not_found' when querying backward with a non-existent cursor", async () => {
        const { context, mocks } = createMockGraphQLContext(true, "user123");
        
        const builder = await import("~/src/graphql/builder");
        const typeConfig = builder.builder.configStore.typeConfigs.get("Fund");
        const pothosOptions = typeConfig?.pothosOptions as any;
        const mockSchemaBuilder = { connection: (config: any) => config };
        const fields = pothosOptions?.fields?.(mockSchemaBuilder);
        const campaignsResolver = fields?.campaigns?.resolve;

        const fund = { id: "fund123", name: "School Fund" };
        const cursorPayload = JSON.stringify({ name: "Non Existent Campaign" });
        const validCursor = Buffer.from(cursorPayload).toString("base64url");

        mocks.drizzleClient.query.fundCampaignsTable.findMany.mockResolvedValue([]);

        const args = {
            last: 10,
            before: validCursor,
        };

        try {
            await campaignsResolver(fund, args, context);
        } catch (error: any) {
            expect(error.extensions?.code).toBe("arguments_associated_resources_not_found");
            expect(error.extensions?.issues[0].argumentPath).toEqual(["before"]);
        }
    });

    it("should handle forward pagination with a cursor and correctly calculate complexity", async () => {
        const { context, mocks } = createMockGraphQLContext(true, "user123");
        
        const builder = await import("~/src/graphql/builder");
        const typeConfig = builder.builder.configStore.typeConfigs.get("Fund");
        const pothosOptions = typeConfig?.pothosOptions as any;
        const mockSchemaBuilder = { connection: (config: any) => config };
        const fields = pothosOptions?.fields?.(mockSchemaBuilder);
        const campaignsResolver = fields?.campaigns?.resolve;
        const complexityFn = fields?.campaigns?.complexity;

        const fund = { id: "fund123", name: "School Fund" };
        const cursorPayload = JSON.stringify({ name: "Campaign A" });
        const validCursor = Buffer.from(cursorPayload).toString("base64url");

        const args = {
            first: 5,
            after: validCursor,
        };

        mocks.drizzleClient.query.fundCampaignsTable.findMany.mockResolvedValue([
            { id: "c2", name: "Campaign B", fundId: "fund123" }
        ]);

        const result = await campaignsResolver(fund, args, context);
        expect(result.edges).toHaveLength(1);
        expect(result.edges[0].node.name).toBe("Campaign B");

        if (complexityFn) {
            const cost = complexityFn(args);
            expect(cost).toHaveProperty("multiplier", 5);
        }
    });

    it("should handle backward pagination correctly without a provided cursor", async () => {
        const { context, mocks } = createMockGraphQLContext(true, "user123");
        
        const builder = await import("~/src/graphql/builder");
        const typeConfig = builder.builder.configStore.typeConfigs.get("Fund");
        const pothosOptions = typeConfig?.pothosOptions as any;
        const mockSchemaBuilder = { connection: (config: any) => config };
        const fields = pothosOptions?.fields?.(mockSchemaBuilder);
        const campaignsResolver = fields?.campaigns?.resolve;

        const fund = { id: "fund123", name: "School Fund" };

        mocks.drizzleClient.query.fundCampaignsTable.findMany.mockResolvedValue([
            { id: "c3", name: "Campaign Z", fundId: "fund123" }
        ]);

        const args = {
            last: 5
        };

        const result = await campaignsResolver(fund, args, context);

        expect(result.edges).toHaveLength(1);
        expect(result.edges[0].node.name).toBe("Campaign Z");
    });

    it("should handle 'not found' errors during forward pagination and apply complexity defaults", async () => {
        const { context, mocks } = createMockGraphQLContext(true, "user123");
        
        const builder = await import("~/src/graphql/builder");
        const typeConfig = builder.builder.configStore.typeConfigs.get("Fund");
        const pothosOptions = typeConfig?.pothosOptions as any;
        const mockSchemaBuilder = { connection: (config: any) => config };
        const fields = pothosOptions?.fields?.(mockSchemaBuilder);
        const campaignsResolver = fields?.campaigns?.resolve;
        const complexityFn = fields?.campaigns?.complexity;

        const fund = { id: "fund123", name: "School Fund" };

        mocks.drizzleClient.query.fundCampaignsTable.findMany.mockResolvedValue([]);

        const cursor = Buffer.from(JSON.stringify({ name: "Ghost Campaign" })).toString("base64url");
        const args = { first: 10, after: cursor };

        try {
            await campaignsResolver(fund, args, context);
        } catch (error: any) {
            expect(error.extensions?.code).toBe("arguments_associated_resources_not_found");
            expect(error.extensions?.issues[0].argumentPath).toEqual(["after"]);
        }

        if (complexityFn) {
            expect(complexityFn({ last: 8 })).toHaveProperty("multiplier", 8);
            expect(complexityFn({})).toHaveProperty("multiplier", 1);
        }
    });

    it("should validate cursor encoding and catch syntax errors", async () => {
        const { context } = createMockGraphQLContext(true, "user123");
        
        const builder = await import("~/src/graphql/builder");
        const typeConfig = builder.builder.configStore.typeConfigs.get("Fund");
        const pothosOptions = typeConfig?.pothosOptions as any;
        const mockSchemaBuilder = { connection: (config: any) => config };
        const fields = pothosOptions?.fields?.(mockSchemaBuilder);
        const campaignsResolver = fields?.campaigns?.resolve;

        const fund = { id: "fund123", name: "School Fund" };
        const invalidCursor = Buffer.from("INVALID_JSON").toString("base64url");
        
        const args = {
            first: 10,
            after: invalidCursor
        };

        try {
            await campaignsResolver(fund, args, context);
        } catch (error: any) {
            expect(error.extensions?.code).toBe("invalid_arguments");
            expect(error.extensions?.issues[0].message).toBe("Not a valid cursor.");
        }
    });

    it("should validate cursor encoding during backward pagination and return correct error path", async () => {
        const { context } = createMockGraphQLContext(true, "user123");
        
        const builder = await import("~/src/graphql/builder");
        const typeConfig = builder.builder.configStore.typeConfigs.get("Fund");
        const pothosOptions = typeConfig?.pothosOptions as any;
        const mockSchemaBuilder = { connection: (config: any) => config };
        const fields = pothosOptions?.fields?.(mockSchemaBuilder);
        const campaignsResolver = fields?.campaigns?.resolve;

        const fund = { id: "fund123", name: "School Fund" };
        const invalidCursor = Buffer.from("INVALID_JSON_DATA").toString("base64url");
        
        const args = {
            last: 5,
            before: invalidCursor 
        };

        try {
            await campaignsResolver(fund, args, context);
        } catch (error: any) {
            expect(error.extensions?.code).toBe("invalid_arguments");
            expect(error.extensions?.issues[0].argumentPath).toEqual(["before"]);
        }
    });
});