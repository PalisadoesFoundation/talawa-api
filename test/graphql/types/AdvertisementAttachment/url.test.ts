import type { GraphQLObjectType } from "graphql";
import { beforeAll, describe, expect, it } from "vitest";
import { schemaManager } from "~/src/graphql/schemaManager";
import type { AdvertisementAttachment } from "~/src/graphql/types/AdvertisementAttachment/AdvertisementAttachment";
// Import the actual implementation to ensure it's loaded for coverage
import "~/src/graphql/types/AdvertisementAttachment/url";
import envConfig from "~/src/utilities/graphqLimits";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";

describe("AdvertisementAttachment.url field resolver", () => {
	let urlResolver!: NonNullable<
		NonNullable<ReturnType<GraphQLObjectType["getFields"]>["url"]>["resolve"]
	>;

	beforeAll(async () => {
		const schema = await schemaManager.buildInitialSchema();
		const advertisementAttachmentType = schema.getType(
			"AdvertisementAttachment",
		) as GraphQLObjectType;
		assertToBeNonNullish(advertisementAttachmentType);

		const urlField = advertisementAttachmentType.getFields().url;
		assertToBeNonNullish(urlField);
		assertToBeNonNullish(urlField.resolve);
		urlResolver = urlField.resolve;
	});

	function createTestContext() {
		return {
			currentClient: { isAuthenticated: true, user: { id: "test-user-id" } },
			drizzleClient: server.drizzleClient,
			log: server.log,
			envConfig: server.envConfig,
			jwt: server.jwt,
			minio: server.minio,
		};
	}

	function createMockParent(
		name: string,
	): Pick<AdvertisementAttachment, "name" | "mimeType" | "advertisementId"> {
		return {
			name,
			mimeType: "image/png",
			advertisementId: "test-advertisement-id",
		};
	}

	describe("URL construction", () => {
		it("should construct URL correctly with a simple file name", async () => {
			const testName = "test-attachment.png";
			const parent = createMockParent(testName);

			const result = await urlResolver(
				parent,
				{},
				createTestContext(),
				{} as never,
			);

			expect(result).toBe(
				new URL(
					`/objects/${testName}`,
					server.envConfig.API_BASE_URL,
				).toString(),
			);
		});

		it("should construct URL correctly with a name containing subdirectory", async () => {
			const testName = "subdirectory/test-attachment.jpg";
			const parent = createMockParent(testName);

			const result = await urlResolver(
				parent,
				{},
				createTestContext(),
				{} as never,
			);

			expect(result).toBe(
				new URL(
					`/objects/${testName}`,
					server.envConfig.API_BASE_URL,
				).toString(),
			);
		});

		it("should construct URL correctly with a name containing dashes and underscores", async () => {
			const testName = "test-file_with-mixed_separators.webp";
			const parent = createMockParent(testName);

			const result = await urlResolver(
				parent,
				{},
				createTestContext(),
				{} as never,
			);

			expect(result).toBe(
				new URL(
					`/objects/${testName}`,
					server.envConfig.API_BASE_URL,
				).toString(),
			);
		});

		it("should return a valid URL string", async () => {
			const testName = "valid-attachment.png";
			const parent = createMockParent(testName);

			const result = await urlResolver(
				parent,
				{},
				createTestContext(),
				{} as never,
			);

			expect(() => new URL(result as string)).not.toThrow();
			expect(result).toContain(testName);
		});

		it("should use the API_BASE_URL from context", async () => {
			const testName = "attachment.png";
			const parent = createMockParent(testName);

			const result = await urlResolver(
				parent,
				{},
				createTestContext(),
				{} as never,
			);

			expect(result).toContain(server.envConfig.API_BASE_URL);
		});

		it("should include /objects/ path in the URL", async () => {
			const testName = "test.png";
			const parent = createMockParent(testName);

			const result = await urlResolver(
				parent,
				{},
				createTestContext(),
				{} as never,
			);

			expect(result).toContain("/objects/");
		});
	});

	describe("URL construction with various name formats", () => {
		const testCases = [
			"simple.png",
			"with-dashes.jpg",
			"with_underscores.gif",
			"nested/path/file.webp",
			"uuid-style-12345678-1234-1234-1234-123456789012.png",
		];

		it.each(testCases)(
			"should construct correct URL for name: %s",
			async (name) => {
				const parent = createMockParent(name);

				const result = await urlResolver(
					parent,
					{},
					createTestContext(),
					{} as never,
				);

				expect(result).toBe(
					new URL(
						`/objects/${name}`,
						server.envConfig.API_BASE_URL,
					).toString(),
				);
			},
		);
	});

	describe("complexity configuration", () => {
		it("should have correct complexity value", async () => {
			const schema = await schemaManager.buildInitialSchema();

			const advertisementAttachmentType = schema.getType(
				"AdvertisementAttachment",
			) as GraphQLObjectType;
			const fields = advertisementAttachmentType.getFields();
			expect(fields.url).toBeDefined();

			const urlField = fields.url;
			assertToBeNonNullish(urlField);

			expect(urlField.extensions?.complexity).toBe(
				envConfig.API_GRAPHQL_SCALAR_FIELD_COST,
			);
		});
	});
});

