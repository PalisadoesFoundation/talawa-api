import { faker } from "@faker-js/faker";
import type { GraphQLObjectType } from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { schema } from "~/src/graphql/schema";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

describe("Query organization - Performance Tracking", () => {
	let organizationQueryResolver: (
		_parent: unknown,
		args: { input: { id: string } },
		ctx: ReturnType<typeof createMockGraphQLContext>["context"],
	) => Promise<unknown>;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.clearAllMocks();
		const queryType = schema.getType("Query") as GraphQLObjectType;
		const organizationField = queryType.getFields().organization;
		if (!organizationField) {
			throw new Error("Organization query field not found");
		}
		organizationQueryResolver =
			organizationField.resolve as typeof organizationQueryResolver;
		if (!organizationQueryResolver) {
			throw new Error("Organization query resolver not found");
		}
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	describe("when performance tracker is available", () => {
		it("should track query execution time on successful query", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const orgId = faker.string.uuid();
			const mockOrganization = {
				id: orgId,
				name: "Test Organization",
				description: "Test description",
				countryCode: "us",
				state: "CA",
				city: "Los Angeles",
				postalCode: "90001",
				addressLine1: "123 Main St",
				addressLine2: null,
				avatarMimeType: null,
				avatarName: null,
				creatorId: "user-123",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: null,
			};

			mocks.drizzleClient.query.organizationsTable.findFirst.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(mockOrganization), 10);
					}),
			);

			const resultPromise = organizationQueryResolver(
				null,
				{ input: { id: orgId } },
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toEqual(mockOrganization);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:organization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(Math.ceil(op?.ms ?? 0)).toBeGreaterThanOrEqual(10);
		});

		it("should track query execution time on validation error", async () => {
			const perf = createPerformanceTracker();
			const { context } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			// Empty ID triggers validation error
			await Promise.all([
				vi.runAllTimersAsync(),
				expect(
					organizationQueryResolver(null, { input: { id: "" } }, context),
				).rejects.toThrow(),
			]);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:organization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track query execution time on not-found error", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const notFoundId = faker.string.uuid();

			mocks.drizzleClient.query.organizationsTable.findFirst.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(undefined), 5);
					}),
			);

			const resultPromise = organizationQueryResolver(
				null,
				{ input: { id: notFoundId } },
				context,
			);

			await Promise.all([
				vi.runAllTimersAsync(),
				expect(resultPromise).rejects.toThrow(),
			]);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:organization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			// Error path may complete faster due to sync validation, just ensure metrics captured
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});
	});

	describe("when performance tracker is not available", () => {
		it("should execute query successfully without perf tracker", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = undefined;

			const orgId = faker.string.uuid();
			const mockOrganization = {
				id: orgId,
				name: "Test Organization No Perf",
				description: "Test description",
				countryCode: "us",
				state: "CA",
				city: "Los Angeles",
				postalCode: "90001",
				addressLine1: "123 Main St",
				addressLine2: null,
				avatarMimeType: null,
				avatarName: null,
				creatorId: "user-123",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: null,
			};

			mocks.drizzleClient.query.organizationsTable.findFirst.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(mockOrganization), 5);
					}),
			);

			const resultPromise = organizationQueryResolver(
				null,
				{ input: { id: orgId } },
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toEqual(mockOrganization);
		});

		it("should handle validation error without perf tracker", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");
			context.perf = undefined;

			await Promise.all([
				vi.runAllTimersAsync(),
				expect(
					organizationQueryResolver(null, { input: { id: "" } }, context),
				).rejects.toThrow(),
			]);
		});

		it("should handle not-found error without perf tracker", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = undefined;

			const notFoundId = faker.string.uuid();

			mocks.drizzleClient.query.organizationsTable.findFirst.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(undefined), 5);
					}),
			);

			const resultPromise = organizationQueryResolver(
				null,
				{ input: { id: notFoundId } },
				context,
			);

			await Promise.all([
				vi.runAllTimersAsync(),
				expect(resultPromise).rejects.toThrow(),
			]);
		});
	});
});
