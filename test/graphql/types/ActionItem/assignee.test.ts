import { describe, expect, test, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { resolveAssignee } from "../../../../src/graphql/types/ActionItem/assignee";

interface TestFields {
	id: string;
}

interface TestOperators {
	eq: (a: string, b: string) => string;
}

type WhereFunction = (fields: TestFields, operators: TestOperators) => string;

describe("resolveAssignee", () => {
	// Create a better mock structure for Drizzle
	const createMockCtx = () => {
		// Create mock functions for Drizzle
		const findFirstMock = vi.fn();

		const ctx = {
			drizzleClient: {
				query: {
					usersTable: {
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

	test("Returns null if assigneeId is null", async () => {
		const { ctx } = createMockCtx();
		const result = await resolveAssignee({ assigneeId: null }, {}, ctx);
		expect(result).toBeNull();
	});

	test("Returns user when assigneeId exists and a user is found", async () => {
		const { ctx, mocks } = createMockCtx();
		const mockUser = { id: "123", name: "Test User" };

		// Setup the mock to return our user
		mocks.findFirst.mockResolvedValue(mockUser);

		const result = await resolveAssignee({ assigneeId: "123" }, {}, ctx);
		expect(result).toEqual(mockUser);
		expect(mocks.findFirst).toHaveBeenCalled();
	});

	test("Throws an error when assignee is not found", async () => {
		const { ctx, mocks } = createMockCtx();

		// Setup the mock to return null (user not found)
		mocks.findFirst.mockResolvedValue(null);

		await expect(
			resolveAssignee({ assigneeId: "456" }, {}, ctx),
		).rejects.toThrow(TalawaGraphQLError);

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Assignee with ID 456 not found for ActionItem.",
		);
	});

	test("Handles database errors gracefully", async () => {
		const { ctx, mocks } = createMockCtx();
		const dbError = new Error("DB error");

		// Setup the mock to throw an error
		mocks.findFirst.mockRejectedValue(dbError);

		await expect(
			resolveAssignee({ assigneeId: "789" }, {}, ctx),
		).rejects.toThrow("DB error");
	});

	test("calls operators.eq with correct parameters", async () => {
		const { ctx, mocks } = createMockCtx();

		// Create a function to capture the where function with proper typing
		let capturedWhereFn: WhereFunction | undefined;

		interface FindFirstArgs {
			where: WhereFunction;
		}

		// Implement mock to capture the where function and return a dummy user
		mocks.findFirst.mockImplementation((args: FindFirstArgs) => {
			capturedWhereFn = args.where;
			return Promise.resolve({ id: "dummy", name: "Dummy User" });
		});

		await resolveAssignee({ assigneeId: "123" }, {}, ctx);

		expect(capturedWhereFn).toBeDefined();

		const dummyFields: TestFields = { id: "dummyId" };
		const dummyOperators: TestOperators = {
			eq: vi.fn((a, b) => `${a}-${b}`), // for example, returns a concatenated string.
		};

		// Call the captured where function with optional chaining instead of non-null assertion
		if (capturedWhereFn) {
			const eqResult = capturedWhereFn(dummyFields, dummyOperators);

			// Expect that the operators.eq function was called with dummyFields.id and "123"
			expect(dummyOperators.eq).toHaveBeenCalledWith("dummyId", "123");

			// And our dummy implementation returns "dummyId-123"
			expect(eqResult).toEqual("dummyId-123");
		} else {
			// Fail the test if capturedWhereFn is undefined
			expect(capturedWhereFn).toBeDefined();
		}
	});
});
