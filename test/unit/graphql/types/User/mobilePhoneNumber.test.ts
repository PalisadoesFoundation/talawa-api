import { faker } from "@faker-js/faker";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, expect, suite, test, vi } from "vitest";
import { mobilePhoneNumberResolver } from "~/src/graphql/types/User/mobilePhoneNumber";
import type { User as UserType } from "~/src/graphql/types/User/User";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

vi.mock("~/src/graphql/types/User/User", () => ({
	User: {
		implement: vi.fn(),
	},
}));

suite("User field mobilePhoneNumber - Unit Tests", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("registers mobilePhoneNumber field in User schema", () => {
		expect(User.implement).toHaveBeenCalledWith(
			expect.objectContaining({
				fields: expect.any(Function),
			}),
		);

		// Extract the fields function and verify it creates the mobilePhoneNumber field
		const implementation = (
			User.implement as unknown as ReturnType<typeof vi.fn>
		).mock.calls[0]?.[0];
		if (!implementation) {
			throw new Error("User.implement was not called with arguments");
		}
		const fieldsBuilder = {
			field: vi.fn((config) => config),
		};
		const fields = implementation.fields(fieldsBuilder);

		expect(fields.mobilePhoneNumber).toBeDefined();
		expect(fieldsBuilder.field).toHaveBeenCalledWith(
			expect.objectContaining({
				resolve: mobilePhoneNumberResolver,
				type: "PhoneNumber",
				description: expect.any(String),
				complexity: expect.any(Number),
			}),
		);
	});

	test("throws unauthenticated error when client is not authenticated for unit test", async () => {
		const userId = faker.string.uuid();
		const { context } = createMockGraphQLContext(false);

		const parent = {
			id: userId,
			mobilePhoneNumber: "1234567890",
		} as unknown as UserType;

		await expect(
			mobilePhoneNumberResolver(parent, {}, context),
		).rejects.toMatchObject({
			extensions: {
				code: "unauthenticated",
			},
		});
	});

	test("throws unauthenticated error when current user is not found in DB", async () => {
		const userId = faker.string.uuid();
		const { context, mocks } = createMockGraphQLContext(true, userId);

		const parent = {
			id: userId,
			mobilePhoneNumber: "1234567890",
		} as unknown as UserType;

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(
			mobilePhoneNumberResolver(parent, {}, context),
		).rejects.toMatchObject({
			extensions: {
				code: "unauthenticated",
			},
		});
	});

	test("throws unauthorized_action error when user is not admin and accessing another user's data", async () => {
		const currentUserId = faker.string.uuid();
		const otherUserId = faker.string.uuid();
		const { context, mocks } = createMockGraphQLContext(true, currentUserId);

		const parent = {
			id: otherUserId,
			mobilePhoneNumber: "1234567890",
		} as unknown as UserType;

		mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
			async (...funcArgs: unknown[]) => {
				const args = funcArgs[0] as {
					where?: (
						fields: Record<string, unknown>,
						operators: Record<string, (a: unknown, b: unknown) => boolean>,
					) => boolean;
				};
				// Execute the where callback to ensure coverage
				if (args?.where) {
					args.where(
						{ id: currentUserId },
						{ eq: (_a: unknown, _b: unknown) => true },
					);
				}
				return {
					role: "regular",
				};
			},
		);

		await expect(
			mobilePhoneNumberResolver(parent, {}, context),
		).rejects.toMatchObject({
			extensions: {
				code: "unauthorized_action",
			},
		});
	});

	test("returns mobilePhoneNumber when user is admin accessing another user's data", async () => {
		const currentUserId = faker.string.uuid();
		const otherUserId = faker.string.uuid();
		const { context, mocks } = createMockGraphQLContext(true, currentUserId);
		const expectedPhoneNumber = "1234567890";

		const parent = {
			id: otherUserId,
			mobilePhoneNumber: expectedPhoneNumber,
		} as unknown as UserType;

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});

		const result = await mobilePhoneNumberResolver(parent, {}, context);
		expect(result).toBe(expectedPhoneNumber);
	});

	test("returns mobilePhoneNumber when user is accessing their own data (even if not admin)", async () => {
		const currentUserId = faker.string.uuid();
		const { context, mocks } = createMockGraphQLContext(true, currentUserId);
		const expectedPhoneNumber = "1234567890";

		const parent = {
			id: currentUserId,
			mobilePhoneNumber: expectedPhoneNumber,
		} as unknown as UserType;

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const result = await mobilePhoneNumberResolver(parent, {}, context);
		expect(result).toBe(expectedPhoneNumber);
	});

	test("handles null or empty mobilePhoneNumber correctly", async () => {
		const userId = faker.string.uuid();
		const { context, mocks } = createMockGraphQLContext(true, userId);

		const parentNull = {
			id: userId,
			mobilePhoneNumber: null,
		} as unknown as UserType;

		const parentEmpty = {
			id: userId,
			mobilePhoneNumber: "",
		} as unknown as UserType;

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const resultNull = await mobilePhoneNumberResolver(parentNull, {}, context);
		const resultEmpty = await mobilePhoneNumberResolver(
			parentEmpty,
			{},
			context,
		);

		expect(resultNull).toBeNull();
		expect(resultEmpty).toBe("");
	});

	test("wraps generic Error in Internal Server Error", async () => {
		const userId = faker.string.uuid();
		const { context, mocks } = createMockGraphQLContext(true, userId);

		const parent = {
			id: userId,
		} as unknown as UserType;

		const genericError = new Error("Something went wrong");
		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			genericError,
		);

		try {
			await mobilePhoneNumberResolver(parent, {}, context);
		} catch (error) {
			expect(context.log.error).toHaveBeenCalledWith(genericError);
			expect(error).toMatchObject({
				message: "Internal server error",
				extensions: {
					code: "unexpected",
				},
			});
		}
	});

	test("rethrows TalawaGraphQLError as is", async () => {
		const userId = faker.string.uuid();
		const { context, mocks } = createMockGraphQLContext(true, userId);

		const parent = {
			id: userId,
		} as unknown as UserType;

		const talawaError = new TalawaGraphQLError({
			message: "Custom error",
			extensions: { code: "unauthenticated" },
		});
		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			talawaError,
		);

		await expect(
			mobilePhoneNumberResolver(parent, {}, context),
		).rejects.toThrow(talawaError);
	});
});
