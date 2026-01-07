/**
 * Unit Tests for updateStandaloneEvent Resolver - Cache Invalidation Logic
 *
 * PURPOSE: These unit tests specifically verify cache invalidation behavior
 * including graceful degradation when cache operations fail.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("postgres", () => ({
	default: vi.fn(() => ({
		end: vi.fn(),
	})),
}));

vi.mock("~/src/server", () => ({
	server: {
		envConfig: {},
		minio: { client: { putObject: vi.fn(), removeObject: vi.fn() } },
	},
}));

// Mock utilities - TalawaGraphQLError mock matches real constructor signature
vi.mock("~/src/utilities/TalawaGraphQLError", () => ({
	TalawaGraphQLError: class TalawaGraphQLError extends Error {
		extensions: Record<string, unknown>;

		constructor(options: {
			message?: string;
			extensions: Record<string, unknown>;
		}) {
			super(options.message ?? "GraphQL Error");
			this.extensions = options.extensions;
		}
	},
}));

vi.mock("~/src/utilities/isNotNullish", () => ({
	isNotNullish: (val: unknown) => val !== null && val !== undefined,
}));

// Hoist mocks to be accessible inside vi.mock
const mocks = vi.hoisted(() => {
	return {
		builder: {
			mutationField: vi.fn(),
			field: vi.fn((args) => args),
			arg: vi.fn(),
			type: vi.fn(),
			required: vi.fn(),
			resolve: vi.fn(),
			objectRef: vi.fn(),
			inputType: vi.fn(),
			inputRef: vi.fn(),
			enumType: vi.fn(),
			scalarType: vi.fn(),
			interfaceType: vi.fn(),
			unionType: vi.fn(),
			queryField: vi.fn(),
		},
		drizzle: {
			update: vi.fn(),
			set: vi.fn(),
			where: vi.fn(),
			returning: vi.fn().mockResolvedValue([
				{
					id: "event-1",
					name: "Updated Event",
					startAt: new Date(),
					endAt: new Date(),
					organizationId: "org-1",
				},
			]),
			query: {
				usersTable: {
					findFirst: vi.fn(),
				},
				eventsTable: {
					findFirst: vi.fn(),
				},
			},
		},
		minio: {
			client: {
				putObject: vi.fn().mockResolvedValue({}),
				removeObject: vi.fn().mockResolvedValue({}),
			},
			bucketName: "talawa",
		},
		invalidateEntity: vi.fn().mockResolvedValue(undefined),
		invalidateEntityLists: vi.fn().mockResolvedValue(undefined),
	};
});

// Configure Drizzle Mock for update chain
mocks.drizzle.update.mockReturnValue(mocks.drizzle);
mocks.drizzle.set.mockReturnValue(mocks.drizzle);
mocks.drizzle.where.mockReturnValue(mocks.drizzle);

vi.mock("~/src/graphql/builder", () => ({
	builder: mocks.builder,
}));

// Mock cache invalidation functions
vi.mock("~/src/services/caching", () => ({
	invalidateEntity: mocks.invalidateEntity,
	invalidateEntityLists: mocks.invalidateEntityLists,
}));

// Mock context and services
const mockContext = {
	currentClient: {
		isAuthenticated: true,
		user: { id: "admin-id" },
	},
	drizzleClient: mocks.drizzle,
	minio: mocks.minio,
	cache: {
		del: vi.fn().mockResolvedValue(undefined),
		clearByPattern: vi.fn().mockResolvedValue(undefined),
	},
	log: {
		error: vi.fn(),
		warn: vi.fn(),
		info: vi.fn(),
	},
};

vi.mock("~/src/drizzle/client", () => ({
	drizzleClient: mocks.drizzle,
}));

vi.mock("~/src/services/minio", () => ({
	minio: mocks.minio,
}));

// Mock the Event type to prevent import errors or side effects
vi.mock("~/src/graphql/types/Event/Event", () => ({
	Event: "EventType",
}));

vi.mock("~/src/graphql/inputs/MutationUpdateEventInput", async () => {
	const { z } = await vi.importActual<typeof import("zod")>("zod");
	return {
		mutationUpdateEventInputSchema: z.object({
			id: z.string().uuid(),
			name: z.string().optional(),
			description: z.string().optional(),
			startAt: z.date().optional(),
			endAt: z.date().optional(),
			allDay: z.boolean().optional(),
			isPublic: z.boolean().optional(),
			isRegisterable: z.boolean().optional(),
			isInviteOnly: z.boolean().optional(),
			location: z.string().optional(),
		}),
		MutationUpdateEventInput: "MutationUpdateEventInput",
	};
});

import "~/src/graphql/types/Mutation/updateStandaloneEvent";

describe("updateStandaloneEvent Resolver Cache Invalidation Tests", () => {
	let resolver: (...args: unknown[]) => unknown;

	beforeAll(() => {
		// Capture the resolver from the builder mock
		const calls = mocks.builder.mutationField.mock.calls;
		const updateEventCall = calls.find(
			(c: unknown[]) => c[0] === "updateStandaloneEvent",
		);
		if (updateEventCall) {
			// The resolver is passed in the field definition
			const fieldDef = updateEventCall[1]({
				field: mocks.builder.field,
				arg: mocks.builder.arg,
			});
			resolver = fieldDef.resolve;
		}
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should be defined", () => {
		expect(resolver).toBeDefined();
	});

	describe("Cache invalidation is called with correct arguments", () => {
		it("should call invalidateEntity and invalidateEntityLists with correct args after successful update", async () => {
			const eventId = "01234567-89ab-cdef-0123-456789abcdef";

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});
			mocks.drizzle.query.eventsTable.findFirst.mockResolvedValue({
				id: eventId,
				startAt: new Date(),
				endAt: new Date(Date.now() + 3600000),
				creatorId: "admin-id",
				attachmentsWhereEvent: [],
				organization: {
					countryCode: "us",
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			});
			mocks.drizzle.returning.mockResolvedValueOnce([
				{
					id: eventId,
					name: "Updated Event",
					startAt: new Date(),
					endAt: new Date(),
					organizationId: "org-1",
				},
			]);

			const args = {
				input: {
					id: eventId,
					name: "Updated Event Name",
				},
			};

			await resolver(null, args, mockContext);

			// Verify invalidateEntity was called with correct arguments
			expect(mocks.invalidateEntity).toHaveBeenCalledWith(
				mockContext.cache,
				"event",
				eventId,
			);
			expect(mocks.invalidateEntity).toHaveBeenCalledTimes(1);

			// Verify invalidateEntityLists was called with correct arguments
			expect(mocks.invalidateEntityLists).toHaveBeenCalledWith(
				mockContext.cache,
				"event",
			);
			expect(mocks.invalidateEntityLists).toHaveBeenCalledTimes(1);
		});
	});

	describe("Cache invalidation error handling (graceful degradation)", () => {
		it("should succeed despite invalidateEntity throwing an error", async () => {
			const eventId = "11234567-89ab-cdef-0123-456789abcdef";

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});
			mocks.drizzle.query.eventsTable.findFirst.mockResolvedValue({
				id: eventId,
				startAt: new Date(),
				endAt: new Date(Date.now() + 3600000),
				creatorId: "admin-id",
				attachmentsWhereEvent: [],
				organization: {
					countryCode: "us",
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			});
			mocks.drizzle.returning.mockResolvedValueOnce([
				{
					id: eventId,
					name: "Updated Event",
					startAt: new Date(),
					endAt: new Date(),
					organizationId: "org-1",
				},
			]);

			// Make cache invalidation throw an error
			const cacheError = new Error("Redis connection failed");
			mocks.invalidateEntity.mockRejectedValueOnce(cacheError);

			const args = {
				input: {
					id: eventId,
					name: "Updated Event Name",
				},
			};

			// Resolver should succeed despite cache errors (graceful degradation)
			const result = await resolver(null, args, mockContext);

			// Verify the resolver succeeded and returned the updated event
			expect(result).toBeDefined();

			// Verify cache invalidation was attempted
			expect(mocks.invalidateEntity).toHaveBeenCalled();

			// Verify warning was logged with the full error object and eventId
			expect(mockContext.log.warn).toHaveBeenCalledWith(
				{
					error: cacheError,
					eventId: eventId,
				},
				"Failed to invalidate event cache (non-fatal)",
			);
		});

		it("should succeed despite invalidateEntityLists throwing an error", async () => {
			const eventId = "21234567-89ab-cdef-0123-456789abcdef";

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});
			mocks.drizzle.query.eventsTable.findFirst.mockResolvedValue({
				id: eventId,
				startAt: new Date(),
				endAt: new Date(Date.now() + 3600000),
				creatorId: "admin-id",
				attachmentsWhereEvent: [],
				organization: {
					countryCode: "us",
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			});
			mocks.drizzle.returning.mockResolvedValueOnce([
				{
					id: eventId,
					name: "Updated Event",
					startAt: new Date(),
					endAt: new Date(),
					organizationId: "org-1",
				},
			]);

			// invalidateEntity succeeds, invalidateEntityLists fails
			mocks.invalidateEntity.mockResolvedValueOnce(undefined);
			const cacheError = new Error("Redis timeout");
			mocks.invalidateEntityLists.mockRejectedValueOnce(cacheError);

			const args = {
				input: {
					id: eventId,
					name: "Updated Event Name",
				},
			};

			// Resolver should succeed despite cache errors (graceful degradation)
			const result = await resolver(null, args, mockContext);

			// Verify the resolver succeeded
			expect(result).toBeDefined();

			// Verify cache invalidation was attempted
			expect(mocks.invalidateEntityLists).toHaveBeenCalled();

			// Verify warning was logged with the full error and eventId
			expect(mockContext.log.warn).toHaveBeenCalledWith(
				{
					error: cacheError,
					eventId: eventId,
				},
				"Failed to invalidate event cache (non-fatal)",
			);
		});

		it("should short-circuit on invalidateEntity failure and NOT call invalidateEntityLists", async () => {
			const eventId = "41234567-89ab-cdef-0123-456789abcdef";

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});
			mocks.drizzle.query.eventsTable.findFirst.mockResolvedValue({
				id: eventId,
				startAt: new Date(),
				endAt: new Date(Date.now() + 3600000),
				creatorId: "admin-id",
				attachmentsWhereEvent: [],
				organization: {
					countryCode: "us",
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			});
			mocks.drizzle.returning.mockResolvedValueOnce([
				{
					id: eventId,
					name: "Updated Event",
					startAt: new Date(),
					endAt: new Date(),
					organizationId: "org-1",
				},
			]);

			// Make invalidateEntity throw an error (simulating consecutive cache failures)
			const cacheError = new Error("Redis unavailable");
			mocks.invalidateEntity.mockRejectedValueOnce(cacheError);

			const args = {
				input: {
					id: eventId,
					name: "Updated Event Name",
				},
			};

			// Resolver should succeed despite cache errors (graceful degradation)
			const result = await resolver(null, args, mockContext);

			// Verify the resolver succeeded and returned the updated event
			expect(result).toBeDefined();

			// Verify invalidateEntity was called (and threw)
			expect(mocks.invalidateEntity).toHaveBeenCalledWith(
				mockContext.cache,
				"event",
				eventId,
			);
			expect(mocks.invalidateEntity).toHaveBeenCalledTimes(1);

			// Verify invalidateEntityLists was NOT called (try-block short-circuited)
			expect(mocks.invalidateEntityLists).not.toHaveBeenCalled();

			// Verify warning was logged with the error and eventId
			expect(mockContext.log.warn).toHaveBeenCalledWith(
				{
					error: cacheError,
					eventId: eventId,
				},
				"Failed to invalidate event cache (non-fatal)",
			);
		});
	});

	describe("Cache invalidation is executed after the DB update", () => {
		it("should call cache invalidation after database update completes", async () => {
			const eventId = "31234567-89ab-cdef-0123-456789abcdef";
			const callOrder: string[] = [];

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});
			mocks.drizzle.query.eventsTable.findFirst.mockResolvedValue({
				id: eventId,
				startAt: new Date(),
				endAt: new Date(Date.now() + 3600000),
				creatorId: "admin-id",
				attachmentsWhereEvent: [],
				organization: {
					countryCode: "us",
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			});

			mocks.drizzle.returning.mockImplementationOnce(async () => {
				callOrder.push("db_update");
				return [
					{
						id: eventId,
						name: "Updated Event",
						startAt: new Date(),
						endAt: new Date(),
						organizationId: "org-1",
					},
				];
			});

			mocks.invalidateEntity.mockImplementationOnce(async () => {
				callOrder.push("invalidateEntity");
			});

			mocks.invalidateEntityLists.mockImplementationOnce(async () => {
				callOrder.push("invalidateEntityLists");
			});

			const args = {
				input: {
					id: eventId,
					name: "Updated Event Name",
				},
			};

			await resolver(null, args, mockContext);

			// Verify all steps were executed
			expect(callOrder).toContain("db_update");
			expect(callOrder).toContain("invalidateEntity");
			expect(callOrder).toContain("invalidateEntityLists");

			// Verify order: DB update completes before cache invalidation
			expect(callOrder.indexOf("db_update")).toBeLessThan(
				callOrder.indexOf("invalidateEntity"),
			);
			expect(callOrder.indexOf("db_update")).toBeLessThan(
				callOrder.indexOf("invalidateEntityLists"),
			);
		});
	});
});
