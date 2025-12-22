import type { GraphQLObjectType } from "graphql";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { Organization } from "~/src/graphql/types/Organization/Organization";
// Import the actual implementation to ensure it's loaded for coverage
import "~/src/graphql/types/Organization/avatarURL";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";

// Get the avatarURL resolver from the schema
const organizationType = schema.getType("Organization");
if (!organizationType || !("getFields" in organizationType)) {
	throw new Error("Organization type not found or is not an object type");
}
const avatarURLField = (organizationType as GraphQLObjectType).getFields()
	.avatarURL;
if (typeof avatarURLField?.resolve !== "function") {
	throw new Error("avatarURL field resolver is not a function");
}

const avatarURLResolver = avatarURLField.resolve as (
	parent: Organization,
	args: Record<string, never>,
	ctx: GraphQLContext,
) => Promise<string | null>;

describe("Organization.avatarURL field resolver - Unit tests", () => {
	let ctx: GraphQLContext;
	let mockOrganization: Organization;

	beforeEach(() => {
		const { context } = createMockGraphQLContext(true, "user123");
		ctx = context;
		mockOrganization = {
			id: "org-111",
			name: "Test Organization",
			description: "A test organization",
			addressLine1: "123 Test St",
			addressLine2: "Suite 100",
			city: "Test City",
			state: "Test State",
			postalCode: "12345",
			countryCode: "us",
			avatarMimeType: "image/png",
			avatarName: "test-avatar.png",
			createdAt: new Date("2024-01-01T00:00:00Z"),
			updatedAt: new Date("2024-01-15T10:30:00Z"),
			creatorId: "creator-123",
			updaterId: null,
			userRegistrationRequired: false,
		};
	});

	describe("Null avatarName handling", () => {
		it("should return null when avatarName is null", async () => {
			mockOrganization.avatarName = null;

			const result = await avatarURLResolver(mockOrganization, {}, ctx);

			expect(result).toBeNull();
		});
	});

	describe("URL construction", () => {
		it("should return a valid URL when avatarName is provided", async () => {
			mockOrganization.avatarName = "test-avatar.png";

			const result = await avatarURLResolver(mockOrganization, {}, ctx);

			expect(result).toBe("http://localhost:4000/objects/test-avatar.png");
		});

		it("should construct URL with the correct base URL from context", async () => {
			ctx.envConfig.API_BASE_URL = "https://api.example.com";
			mockOrganization.avatarName = "avatar-123.jpg";

			const result = await avatarURLResolver(mockOrganization, {}, ctx);

			expect(result).toBe("https://api.example.com/objects/avatar-123.jpg");
		});

		it("should handle avatar names with special characters", async () => {
			mockOrganization.avatarName = "avatar_with-special.chars.png";

			const result = await avatarURLResolver(mockOrganization, {}, ctx);

			expect(result).toBe(
				"http://localhost:4000/objects/avatar_with-special.chars.png",
			);
		});

		it("should handle avatar names with UUID format", async () => {
			mockOrganization.avatarName = "123e4567-e89b-12d3-a456-426614174000.png";

			const result = await avatarURLResolver(mockOrganization, {}, ctx);

			expect(result).toBe(
				"http://localhost:4000/objects/123e4567-e89b-12d3-a456-426614174000.png",
			);
		});

		it("should handle avatar names with path separators", async () => {
			mockOrganization.avatarName = "folder/subfolder/avatar.png";

			const result = await avatarURLResolver(mockOrganization, {}, ctx);

			expect(result).toBe(
				"http://localhost:4000/objects/folder/subfolder/avatar.png",
			);
		});
	});

	describe("Different base URL configurations", () => {
		it("should work with HTTP base URL", async () => {
			ctx.envConfig.API_BASE_URL = "http://localhost:8080";
			mockOrganization.avatarName = "test.png";

			const result = await avatarURLResolver(mockOrganization, {}, ctx);

			expect(result).toBe("http://localhost:8080/objects/test.png");
		});

		it("should work with base URL containing port number", async () => {
			ctx.envConfig.API_BASE_URL = "http://localhost:4000";
			mockOrganization.avatarName = "avatar.jpg";

			const result = await avatarURLResolver(mockOrganization, {}, ctx);

			expect(result).toBe("http://localhost:4000/objects/avatar.jpg");
		});

		it("should replace path when base URL contains path (URL constructor behavior)", async () => {
			ctx.envConfig.API_BASE_URL = "https://api.example.com/v1";
			mockOrganization.avatarName = "test.png";

			const result = await avatarURLResolver(mockOrganization, {}, ctx);

			// The URL constructor replaces the entire path when given an absolute path
			expect(result).toBe("https://api.example.com/objects/test.png");
		});

		it("should handle base URL with trailing slash", async () => {
			ctx.envConfig.API_BASE_URL = "http://localhost:4000/";
			mockOrganization.avatarName = "test.png";

			const result = await avatarURLResolver(mockOrganization, {}, ctx);

			expect(result).toBe("http://localhost:4000/objects/test.png");
		});
	});

	describe("Edge cases", () => {
		it("should handle empty string avatarName", async () => {
			mockOrganization.avatarName = "";

			const result = await avatarURLResolver(mockOrganization, {}, ctx);

			expect(result).toBe("http://localhost:4000/objects/");
		});

		it("should handle avatarName with spaces", async () => {
			mockOrganization.avatarName = "avatar with spaces.png";

			const result = await avatarURLResolver(mockOrganization, {}, ctx);

			expect(result).toBe(
				"http://localhost:4000/objects/avatar%20with%20spaces.png",
			);
		});
	});

	describe("Authentication independence", () => {
		it("should work for unauthenticated users", async () => {
			const { context: unauthCtx } = createMockGraphQLContext(false);
			mockOrganization.avatarName = "public-avatar.png";

			const result = await avatarURLResolver(mockOrganization, {}, unauthCtx);

			expect(result).toBe("http://localhost:4000/objects/public-avatar.png");
		});

		it("should return null for unauthenticated users when avatarName is null", async () => {
			const { context: unauthCtx } = createMockGraphQLContext(false);
			mockOrganization.avatarName = null;

			const result = await avatarURLResolver(mockOrganization, {}, unauthCtx);

			expect(result).toBeNull();
		});
	});

	describe("URL string format validation", () => {
		it("should return a valid URL string", async () => {
			mockOrganization.avatarName = "valid-avatar.png";

			const result = await avatarURLResolver(mockOrganization, {}, ctx);

			expect(result).toBeDefined();
			expect(typeof result).toBe("string");

			// Verify it's a valid URL by constructing a URL object
			expect(() => new URL(result as string)).not.toThrow();
		});
	});

	describe("Different avatar file types", () => {
		it.each([
			["PNG", "avatar.png", "image/png"],
			["JPG", "avatar.jpg", "image/jpeg"],
			["WEBP", "avatar.webp", "image/webp"],
			["AVIF", "avatar.avif", "image/avif"],
			["no extension", "avatar-no-extension", "image/png"],
		] as const)("should handle %s avatars", async (_fileType: string, avatarName: string, mimeType:
			| "image/png"
			| "image/jpeg"
			| "image/webp"
			| "image/avif") => {
			mockOrganization.avatarName = avatarName;
			mockOrganization.avatarMimeType = mimeType;

			const result = await avatarURLResolver(mockOrganization, {}, ctx);

			expect(result).toBe(`http://localhost:4000/objects/${avatarName}`);
		});
	});
});
