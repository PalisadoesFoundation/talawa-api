import type { GraphQLObjectType } from "graphql";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { AdvertisementAttachment } from "~/src/graphql/types/AdvertisementAttachment/AdvertisementAttachment";
// Import the actual implementation to ensure it's loaded for coverage
import "~/src/graphql/types/AdvertisementAttachment/url";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";

// Get the url resolver from the schema
const advertisementAttachmentType = schema.getType("AdvertisementAttachment");
if (
	!advertisementAttachmentType ||
	!("getFields" in advertisementAttachmentType)
) {
	throw new Error(
		"AdvertisementAttachment type not found or is not an object type",
	);
}
const urlField = (advertisementAttachmentType as GraphQLObjectType).getFields()
	.url;
if (typeof urlField?.resolve !== "function") {
	throw new Error("url field resolver is not a function");
}

const urlResolver = urlField.resolve as (
	parent: AdvertisementAttachment,
	args: Record<string, never>,
	ctx: GraphQLContext,
) => Promise<string>;

describe("AdvertisementAttachment.url field resolver - Unit tests", () => {
	let ctx: GraphQLContext;
	let mockAttachment: AdvertisementAttachment;

	beforeEach(() => {
		const { context } = createMockGraphQLContext(true, "user123");
		ctx = context;
		mockAttachment = {
			advertisementId: "ad-123",
			name: "test-attachment.png",
			mimeType: "image/png",
			createdAt: new Date("2024-01-01T00:00:00Z"),
			updatedAt: new Date("2024-01-15T10:30:00Z"),
			creatorId: "creator-123",
			updaterId: null,
		};
	});

	describe("URL construction", () => {
		it("should return a valid URL when name is provided", async () => {
			mockAttachment.name = "test-attachment.png";

			const result = await urlResolver(mockAttachment, {}, ctx);

			expect(result).toBe("http://localhost:4000/objects/test-attachment.png");
		});

		it("should construct URL with the correct base URL from context", async () => {
			ctx.envConfig.API_BASE_URL = "https://api.example.com";
			mockAttachment.name = "attachment-123.jpg";

			const result = await urlResolver(mockAttachment, {}, ctx);

			expect(result).toBe("https://api.example.com/objects/attachment-123.jpg");
		});

		it("should handle attachment names with special characters", async () => {
			mockAttachment.name = "attachment_with-special.chars.png";

			const result = await urlResolver(mockAttachment, {}, ctx);

			expect(result).toBe(
				"http://localhost:4000/objects/attachment_with-special.chars.png",
			);
		});

		it("should handle attachment names with UUID format", async () => {
			mockAttachment.name = "123e4567-e89b-12d3-a456-426614174000.png";

			const result = await urlResolver(mockAttachment, {}, ctx);

			expect(result).toBe(
				"http://localhost:4000/objects/123e4567-e89b-12d3-a456-426614174000.png",
			);
		});

		it("should handle attachment names with path separators", async () => {
			mockAttachment.name = "folder/subfolder/attachment.png";

			const result = await urlResolver(mockAttachment, {}, ctx);

			expect(result).toBe(
				"http://localhost:4000/objects/folder/subfolder/attachment.png",
			);
		});
	});

	describe("Different base URL configurations", () => {
		it("should work with HTTP base URL", async () => {
			ctx.envConfig.API_BASE_URL = "http://localhost:8080";
			mockAttachment.name = "test.png";

			const result = await urlResolver(mockAttachment, {}, ctx);

			expect(result).toBe("http://localhost:8080/objects/test.png");
		});

		it("should work with base URL containing port number", async () => {
			ctx.envConfig.API_BASE_URL = "http://localhost:4000";
			mockAttachment.name = "attachment.jpg";

			const result = await urlResolver(mockAttachment, {}, ctx);

			expect(result).toBe("http://localhost:4000/objects/attachment.jpg");
		});

		it("should replace path when base URL contains path (URL constructor behavior)", async () => {
			ctx.envConfig.API_BASE_URL = "https://api.example.com/v1";
			mockAttachment.name = "test.png";

			const result = await urlResolver(mockAttachment, {}, ctx);

			// The URL constructor replaces the entire path when given an absolute path
			expect(result).toBe("https://api.example.com/objects/test.png");
		});

		it("should handle base URL with trailing slash", async () => {
			ctx.envConfig.API_BASE_URL = "http://localhost:4000/";
			mockAttachment.name = "test.png";

			const result = await urlResolver(mockAttachment, {}, ctx);

			expect(result).toBe("http://localhost:4000/objects/test.png");
		});
	});

	describe("Edge cases", () => {
		it("should handle empty string attachment name", async () => {
			mockAttachment.name = "";

			const result = await urlResolver(mockAttachment, {}, ctx);

			expect(result).toBe("http://localhost:4000/objects/");
		});

		it("should handle attachment name with spaces", async () => {
			mockAttachment.name = "attachment with spaces.png";

			const result = await urlResolver(mockAttachment, {}, ctx);

			expect(result).toBe(
				"http://localhost:4000/objects/attachment%20with%20spaces.png",
			);
		});
	});

	describe("Authentication independence", () => {
		it("should work for unauthenticated users", async () => {
			const { context: unauthCtx } = createMockGraphQLContext(false);
			mockAttachment.name = "public-attachment.png";

			const result = await urlResolver(mockAttachment, {}, unauthCtx);

			expect(result).toBe(
				"http://localhost:4000/objects/public-attachment.png",
			);
		});
	});

	describe("URL string format validation", () => {
		it("should return a valid URL string", async () => {
			mockAttachment.name = "valid-attachment.png";

			const result = await urlResolver(mockAttachment, {}, ctx);

			expect(result).toBeDefined();
			expect(typeof result).toBe("string");

			// Verify it's a valid URL by constructing a URL object
			expect(() => new URL(result)).not.toThrow();
		});
	});

	describe("Different attachment file types", () => {
		it.each([
			["PNG", "attachment.png", "image/png"],
			["JPG", "attachment.jpg", "image/jpeg"],
			["MP4", "attachment.mp4", "video/mp4"],
			["no extension", "attachment-no-extension", "image/png"],
		] as const)("should handle %s attachments", async (_fileType: string, attachmentName: string, mimeType:
			| "image/png"
			| "image/jpeg"
			| "video/mp4") => {
			mockAttachment.name = attachmentName;
			mockAttachment.mimeType = mimeType;

			const result = await urlResolver(mockAttachment, {}, ctx);

			expect(result).toBe(`http://localhost:4000/objects/${attachmentName}`);
		});
	});
});
