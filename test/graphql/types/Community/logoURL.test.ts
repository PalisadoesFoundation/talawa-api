import { faker } from "@faker-js/faker";
import type { GraphQLObjectType } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { Community } from "~/src/graphql/types/Community/Community";
// Import the actual implementation to ensure it's loaded for coverage
import "~/src/graphql/types/Community/logoURL";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";

// Get the logoURL resolver from the schema
const communityType = schema.getType("Community");
if (!communityType || !("getFields" in communityType)) {
	throw new Error("Community type not found or is not an object type");
}
const logoURLField = (communityType as GraphQLObjectType).getFields().logoURL;
// Guard: ensure the resolver exists and is callable
if (typeof logoURLField?.resolve !== "function") {
	throw new Error("logoURL field resolver is not a function");
}
const logoURLResolver = logoURLField.resolve as (
	parent: Community,
	args: Record<string, never>,
	ctx: GraphQLContext,
) => Promise<string | null>;

describe("Community.logoURL field resolver - Unit tests", () => {
	let ctx: GraphQLContext;
	let mockCommunity: Community;

	beforeEach(() => {
		vi.clearAllMocks();
		const { context } = createMockGraphQLContext(true, faker.string.uuid());
		ctx = context;
		mockCommunity = {
			id: faker.string.uuid(),
			name: "Test Community",
			createdAt: new Date("2024-01-01T00:00:00Z"),
			updatedAt: new Date("2024-01-15T10:30:00Z"),
			updaterId: null,
			facebookURL: null,
			githubURL: null,
			inactivityTimeoutDuration: null,
			instagramURL: null,
			linkedinURL: null,
			logoMimeType: null,
			logoName: null,
			redditURL: null,
			slackURL: null,
			websiteURL: null,
			xURL: null,
			youtubeURL: null,
		};
	});

	describe("Null logoName handling", () => {
		it("should return null when logoName is null", async () => {
			mockCommunity.logoName = null;

			const result = await logoURLResolver(mockCommunity, {}, ctx);

			expect(result).toBeNull();
		});
	});

	describe("Successful URL construction", () => {
		it("should construct valid URL when logoName is provided", async () => {
			const logoName = faker.string.uuid();
			mockCommunity.logoName = logoName;

			const result = await logoURLResolver(mockCommunity, {}, ctx);

			expect(result).toBe(`${ctx.envConfig.API_BASE_URL}/objects/${logoName}`);
			expect(result).toContain("/objects/");
		});

		it("should handle different base URLs correctly", async () => {
			const logoName = faker.string.uuid();
			mockCommunity.logoName = logoName;

			// Change the base URL in context
			ctx.envConfig.API_BASE_URL = "https://api.example.com:8080";

			const result = await logoURLResolver(mockCommunity, {}, ctx);

			expect(result).toBe(`https://api.example.com:8080/objects/${logoName}`);
		});

		it("should handle base URL with trailing slash", async () => {
			const logoName = faker.string.uuid();
			mockCommunity.logoName = logoName;

			// URL constructor properly normalizes trailing slashes
			ctx.envConfig.API_BASE_URL = "http://localhost:4000/";

			const result = await logoURLResolver(mockCommunity, {}, ctx);

			// URL constructor removes double slashes
			expect(result).toBe(`http://localhost:4000/objects/${logoName}`);
		});

		it("should handle logoName with URL-unsafe characters", async () => {
			const logoName = "logo with spaces & special@chars!.png";
			mockCommunity.logoName = logoName;

			const result = await logoURLResolver(mockCommunity, {}, ctx);

			// URL constructor properly encodes unsafe characters
			const expectedURL = new URL(
				`/objects/${logoName}`,
				ctx.envConfig.API_BASE_URL,
			).toString();
			expect(result).toBe(expectedURL);
			// Verify encoding happened: spaces become %20
			expect(result).toContain("logo%20with%20spaces");
		});

		it("should construct URL with logoName containing file extension", async () => {
			const logoName = `${faker.string.uuid()}.png`;
			mockCommunity.logoName = logoName;

			const result = await logoURLResolver(mockCommunity, {}, ctx);

			expect(result).toBe(`${ctx.envConfig.API_BASE_URL}/objects/${logoName}`);
			expect(result).toContain(".png");
		});

		it("should construct URL with logoName containing path separators", async () => {
			const logoName = `path/to/${faker.string.uuid()}`;
			mockCommunity.logoName = logoName;

			const result = await logoURLResolver(mockCommunity, {}, ctx);

			expect(result).toBe(`${ctx.envConfig.API_BASE_URL}/objects/${logoName}`);
		});
	});

	describe("Edge cases", () => {
		it("should handle empty string logoName", async () => {
			mockCommunity.logoName = "";

			const result = await logoURLResolver(mockCommunity, {}, ctx);

			// Resolver uses strict null check (=== null), so empty string produces a URL
			expect(result).toBe(`${ctx.envConfig.API_BASE_URL}/objects/`);
		});

		it("should construct URL with numeric-like logoName", async () => {
			const logoName = faker.string.numeric(10);
			mockCommunity.logoName = logoName;

			const result = await logoURLResolver(mockCommunity, {}, ctx);

			expect(result).toBe(`${ctx.envConfig.API_BASE_URL}/objects/${logoName}`);
		});
	});
});
