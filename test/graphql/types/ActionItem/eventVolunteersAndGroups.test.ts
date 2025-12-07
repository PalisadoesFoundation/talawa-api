import { afterEach, describe, expect, test, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	resolveVolunteer,
	resolveVolunteerGroup,
} from "../../../../src/graphql/types/ActionItem/eventVolunteersAndGroups";

afterEach(() => {
	vi.clearAllMocks();
});

interface TestFields {
	id: string;
}

interface TestOperators {
	eq: (a: string, b: string) => string;
}

type WhereFunction = (fields: TestFields, operators: TestOperators) => string;

describe("resolveVolunteer", () => {
	// Create a better mock structure for Drizzle
	const createMockCtx = () => {
		// Create mock functions for Drizzle
		const findFirstMock = vi.fn();

		const ctx = {
			drizzleClient: {
				query: {
					eventVolunteersTable: {
						findFirst: findFirstMock,
					},
				},
			},
			log: {
				error: vi.fn(),
			},
			// Add the missing properties from ExplicitGraphQLContext
			currentClient: {},
			envConfig: {},
			jwt: {},
			miniots: {},
		} as unknown as GraphQLContext;

		// Return both the context and the mock functions for control in tests
		return {
			ctx,
			mocks: {
				findFirst: findFirstMock,
			},
		};
	};

	test("Returns null if volunteerId is null", async () => {
		const { ctx } = createMockCtx();
		const result = await resolveVolunteer({ volunteerId: null }, {}, ctx);
		expect(result).toBeNull();
	});

	test("Returns volunteer when volunteerId exists and a volunteer is found", async () => {
		const { ctx, mocks } = createMockCtx();
		const mockVolunteer = {
			id: "volunteer-123",
			userId: "user-123",
			eventId: "event-123",
			hasAccepted: true,
			isPublic: true,
			hoursVolunteered: "10.50",
			isTemplate: false,
		};

		// Setup the mock to return our volunteer
		mocks.findFirst.mockResolvedValue(mockVolunteer);

		const result = await resolveVolunteer(
			{ volunteerId: "volunteer-123" },
			{},
			ctx,
		);
		expect(result).toEqual(mockVolunteer);
		expect(mocks.findFirst).toHaveBeenCalled();
	});

	test("Throws an error when volunteer is not found", async () => {
		const { ctx, mocks } = createMockCtx();

		// Setup the mock to return null (volunteer not found)
		mocks.findFirst.mockResolvedValue(null);

		await expect(
			resolveVolunteer({ volunteerId: "volunteer-456" }, {}, ctx),
		).rejects.toThrow(TalawaGraphQLError);

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Volunteer with ID volunteer-456 not found for ActionItem.",
		);
	});

	test("Handles database errors gracefully", async () => {
		const { ctx, mocks } = createMockCtx();
		const dbError = new Error("DB error");

		// Setup the mock to throw an error
		mocks.findFirst.mockRejectedValue(dbError);

		await expect(
			resolveVolunteer({ volunteerId: "volunteer-789" }, {}, ctx),
		).rejects.toThrow("DB error");
	});

	test("calls operators.eq with correct parameters", async () => {
		const { ctx, mocks } = createMockCtx();

		// Create a function to capture the where function with proper typing
		let capturedWhereFn: WhereFunction | undefined;

		interface FindFirstArgs {
			where: WhereFunction;
		}

		// Implement mock to capture the where function and return a dummy volunteer
		mocks.findFirst.mockImplementation((args: FindFirstArgs) => {
			capturedWhereFn = args.where;
			return Promise.resolve({
				id: "dummy",
				userId: "user-dummy",
				eventId: "event-dummy",
				hasAccepted: true,
				isPublic: true,
				hoursVolunteered: "0.00",
				isTemplate: false,
			});
		});

		await resolveVolunteer({ volunteerId: "volunteer-123" }, {}, ctx);

		expect(capturedWhereFn).toBeDefined();

		const dummyFields: TestFields = { id: "dummyId" };
		const dummyOperators: TestOperators = {
			eq: vi.fn((a, b) => `${a}-${b}`), // for example, returns a concatenated string.
		};

		// Call the captured where function with optional chaining instead of non-null assertion
		if (capturedWhereFn) {
			const eqResult = capturedWhereFn(dummyFields, dummyOperators);

			// Expect that the operators.eq function was called with dummyFields.id and "volunteer-123"
			expect(dummyOperators.eq).toHaveBeenCalledWith(
				"dummyId",
				"volunteer-123",
			);

			// And our dummy implementation returns "dummyId-volunteer-123"
			expect(eqResult).toEqual("dummyId-volunteer-123");
		} else {
			// Fail the test if capturedWhereFn is undefined
			expect(capturedWhereFn).toBeDefined();
		}
	});
});

describe("resolveVolunteerGroup", () => {
	// Create a better mock structure for Drizzle
	const createMockCtx = () => {
		// Create mock functions for Drizzle
		const findFirstMock = vi.fn();

		const ctx = {
			drizzleClient: {
				query: {
					eventVolunteerGroupsTable: {
						findFirst: findFirstMock,
					},
				},
			},
			log: {
				error: vi.fn(),
			},
			// Add the missing properties from ExplicitGraphQLContext
			currentClient: {},
			envConfig: {},
			jwt: {},
			miniots: {},
		} as unknown as GraphQLContext;

		// Return both the context and the mock functions for control in tests
		return {
			ctx,
			mocks: {
				findFirst: findFirstMock,
			},
		};
	};

	test("Returns null if volunteerGroupId is null", async () => {
		const { ctx } = createMockCtx();
		const result = await resolveVolunteerGroup(
			{ volunteerGroupId: null },
			{},
			ctx,
		);
		expect(result).toBeNull();
	});

	test("Returns volunteer group when volunteerGroupId exists and a group is found", async () => {
		const { ctx, mocks } = createMockCtx();
		const mockVolunteerGroup = {
			id: "group-123",
			eventId: "event-123",
			leaderId: "leader-123",
			name: "Test Volunteer Group",
			description: "A test volunteer group",
			volunteersRequired: 5,
			isTemplate: false,
		};

		// Setup the mock to return our volunteer group
		mocks.findFirst.mockResolvedValue(mockVolunteerGroup);

		const result = await resolveVolunteerGroup(
			{ volunteerGroupId: "group-123" },
			{},
			ctx,
		);
		expect(result).toEqual(mockVolunteerGroup);
		expect(mocks.findFirst).toHaveBeenCalled();
	});

	test("Throws an error when volunteer group is not found", async () => {
		const { ctx, mocks } = createMockCtx();

		// Setup the mock to return null (volunteer group not found)
		mocks.findFirst.mockResolvedValue(null);

		await expect(
			resolveVolunteerGroup({ volunteerGroupId: "group-456" }, {}, ctx),
		).rejects.toThrow(TalawaGraphQLError);

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Volunteer Group with ID group-456 not found for ActionItem.",
		);
	});

	test("Handles database errors gracefully", async () => {
		const { ctx, mocks } = createMockCtx();
		const dbError = new Error("DB error");

		// Setup the mock to throw an error
		mocks.findFirst.mockRejectedValue(dbError);

		await expect(
			resolveVolunteerGroup({ volunteerGroupId: "group-789" }, {}, ctx),
		).rejects.toThrow("DB error");
	});

	test("calls operators.eq with correct parameters", async () => {
		const { ctx, mocks } = createMockCtx();

		// Create a function to capture the where function with proper typing
		let capturedWhereFn: WhereFunction | undefined;

		interface FindFirstArgs {
			where: WhereFunction;
		}

		// Implement mock to capture the where function and return a dummy volunteer group
		mocks.findFirst.mockImplementation((args: FindFirstArgs) => {
			capturedWhereFn = args.where;
			return Promise.resolve({
				id: "dummy",
				eventId: "event-dummy",
				leaderId: "leader-dummy",
				name: "Dummy Group",
				description: null,
				volunteersRequired: null,
				isTemplate: false,
			});
		});

		await resolveVolunteerGroup({ volunteerGroupId: "group-123" }, {}, ctx);

		expect(capturedWhereFn).toBeDefined();

		const dummyFields: TestFields = { id: "dummyId" };
		const dummyOperators: TestOperators = {
			eq: vi.fn((a, b) => `${a}-${b}`), // for example, returns a concatenated string.
		};

		// Call the captured where function with optional chaining instead of non-null assertion
		if (capturedWhereFn) {
			const eqResult = capturedWhereFn(dummyFields, dummyOperators);

			// Expect that the operators.eq function was called with dummyFields.id and "group-123"
			expect(dummyOperators.eq).toHaveBeenCalledWith("dummyId", "group-123");

			// And our dummy implementation returns "dummyId-group-123"
			expect(eqResult).toEqual("dummyId-group-123");
		} else {
			// Fail the test if capturedWhereFn is undefined
			expect(capturedWhereFn).toBeDefined();
		}
	});
});
