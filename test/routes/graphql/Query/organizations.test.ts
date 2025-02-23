import { beforeEach, describe, expect, it } from "vitest";
import { vi } from "vitest";
import { GraphQLContext } from "~/src/graphql/context";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { organizationsTableQueryResolver } from "~/src/graphql/types/Query/organizations";

const createMockContext = () => {
	const mockContext = {
		drizzleClient: {
			query: {
				organizationsTable: {
					findFirst: vi.fn(),
					findMany: vi.fn(),
				},
			},
		},
		log: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
	};
	return mockContext as unknown as GraphQLContext;;
};

describe("Organizations Query Resolver Tests", () => {
	let ctx: GraphQLContext;

	beforeEach(() => {
		ctx = createMockContext();
	});

	describe("Input Validation", () => {
		it("should throw error for invalid input schema", async () => {
			const args = { input: { id: "invalid-uuid" } };

			await expect(
				organizationsTableQueryResolver({}, args, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "id"],
								message: "Invalid UUID format",
							},
						],
					},
				}),
			);
		});
	});

	describe("Fetching Organizations", () => {
		it("should return single organization when ID is provided", async () => {
			const mockOrganization = {
				id: "valid-uuid",
				name: "Test Organization",
			};

			(
				ctx.drizzleClient.query.organizationsTable.findFirst as ReturnType<
					typeof vi.fn
				>
			).mockResolvedValue(mockOrganization);

			const args = { input: { id: "valid-uuid" } };

			const result = await organizationsTableQueryResolver({}, args, ctx);

			expect(result).toEqual([mockOrganization]);
		});

		it("should throw error when organization not found by ID", async () => {
			(
				ctx.drizzleClient.query.organizationsTable.findFirst as ReturnType<
					typeof vi.fn
				>
			).mockResolvedValue(null);

			const args = { input: { id: "non-existent-uuid" } };

			await expect(
				organizationsTableQueryResolver({}, args, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
				}),
			);
		});

		it("should return up to 20 organizations when no ID is provided", async () => {
			const mockOrganizations = Array.from({ length: 20 }, (_, index) => ({
				id: `org-${index}`,
				name: `Organization ${index}`,
			}));

			(
				ctx.drizzleClient.query.organizationsTable.findMany as ReturnType<
					typeof vi.fn
				>
			).mockResolvedValue(mockOrganizations);

			const args = { input: null };

			const result = await organizationsTableQueryResolver({}, args, ctx);

			expect(result).toEqual(mockOrganizations);
			expect(result).toHaveLength(20);
		});
	});

	describe("Error Handling", () => {
		it("should handle unexpected errors gracefully", async () => {
			(
				ctx.drizzleClient.query.organizationsTable.findMany as ReturnType<
					typeof vi.fn
				>
			).mockRejectedValue(new Error("Database connection failed"));

			const args = { input: null };

			await expect(
				organizationsTableQueryResolver({}, args, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unauthorized_action" },
				}),
			);
			expect(ctx.log.error).toHaveBeenCalled();
		});
	});
});
