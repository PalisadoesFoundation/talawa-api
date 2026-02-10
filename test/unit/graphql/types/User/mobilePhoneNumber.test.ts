import { faker } from "@faker-js/faker";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, expect, suite, test, vi } from "vitest";
import { mobilePhoneNumberResolver } from "~/src/graphql/types/User/mobilePhoneNumber";
import type { User as UserType } from "~/src/graphql/types/User/User";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Mock User to capture implement call
vi.mock("~/src/graphql/types/User/User", () => ({
	User: {
		implement: vi.fn(),
	},
}));

suite("User field mobilePhoneNumber", () => {
	suite("Schema Definition", () => {
		test("registers mobilePhoneNumber field", () => {
			expect(User.implement).toHaveBeenCalledWith(
				expect.objectContaining({
					fields: expect.any(Function),
				}),
			);

			// Invoke the callback to cover the lines
			const call = (
				User.implement as unknown as {
					mock: { calls: Array<[{ fields: (t: unknown) => void }]> };
				}
			).mock.calls.find((args) => args[0].fields);
			if (!call) {
				throw new Error("Expected implement call not found");
			}
			const fieldsCallback = call[0].fields;

			const t = {
				field: vi.fn(),
			};
			fieldsCallback(t);

			expect(t.field).toHaveBeenCalledWith(
				expect.objectContaining({
					resolve: mobilePhoneNumberResolver,
					type: "PhoneNumber",
				}),
			);
		});
	});

	suite("Unit Tests", () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		test("throws unauthenticated error when client is not authenticated", async () => {
			const _userId = faker.string.uuid();
			const { context } = createMockGraphQLContext(false, _userId); // Not authenticated

			const parent = {
				id: _userId,
			} as unknown as UserType;

			await expect(
				mobilePhoneNumberResolver(parent, {}, context),
			).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
				}),
			);
		});

		test("throws unauthenticated error when user is not found in database", async () => {
			const _userId = faker.string.uuid();
			const { context, mocks } = createMockGraphQLContext(true, _userId);

			const parent = {
				id: _userId,
			} as unknown as UserType;

			// Mock findFirst to return undefined (user not found)
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				mobilePhoneNumberResolver(parent, {}, context),
			).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
				}),
			);
		});

		test("throws unauthorized_action error when non-admin accesses another user's data", async () => {
			const currentUserId = faker.string.uuid();
			const otherUserId = faker.string.uuid();
			const { context, mocks } = createMockGraphQLContext(true, currentUserId);

			const parent = {
				id: otherUserId, // Accessing another user's data
			} as unknown as UserType;

			// Mock findFirst to return a regular user
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});

			await expect(
				mobilePhoneNumberResolver(parent, {}, context),
			).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthorized_action",
					}),
				}),
			);
		});

		test("returns mobilePhoneNumber when user accesses their own data", async () => {
			const _userId = faker.string.uuid();
			const { context, mocks } = createMockGraphQLContext(true, _userId);

			const expectedPhoneNumber = faker.phone.number();
			const parent = {
				id: _userId, // Accessing own data
				mobilePhoneNumber: expectedPhoneNumber,
			} as unknown as UserType;

			// Mock findFirst to return a regular user
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});

			const result = await mobilePhoneNumberResolver(parent, {}, context);
			expect(result).toBe(expectedPhoneNumber);
		});

		test("returns mobilePhoneNumber when administrator accesses another user's data", async () => {
			const adminUserId = faker.string.uuid();
			const otherUserId = faker.string.uuid();
			const { context, mocks } = createMockGraphQLContext(true, adminUserId);

			const expectedPhoneNumber = faker.phone.number();
			const parent = {
				id: otherUserId,
				mobilePhoneNumber: expectedPhoneNumber,
			} as unknown as UserType;

			// Mock findFirst to return an administrator
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});

			const result = await mobilePhoneNumberResolver(parent, {}, context);
			expect(result).toBe(expectedPhoneNumber);

			// Invoke the where callback for coverage
			expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalled();
			const findFirstMock = mocks.drizzleClient.query.usersTable
				.findFirst as unknown as {
				mock: {
					calls: Array<
						[
							{
								where: (fields: unknown, operators: unknown) => void;
							},
						]
					>;
				};
			};
			const findFirstCall = findFirstMock.mock.calls[0];
			if (!findFirstCall) {
				throw new Error("Expected findFirst call not found");
			}
			const whereCallback = findFirstCall[0].where;

			const operators = { eq: vi.fn() };
			const fields = { id: "test-id" };
			whereCallback(fields, operators);
			expect(operators.eq).toHaveBeenCalledWith("test-id", adminUserId);
		});

		test("handles null or empty mobilePhoneNumber correctly", async () => {
			const _userId = faker.string.uuid();
			const { context, mocks } = createMockGraphQLContext(true, _userId);

			const parentNull = {
				id: _userId,
				mobilePhoneNumber: null,
			} as unknown as UserType;

			const parentEmpty = {
				id: _userId,
				mobilePhoneNumber: "",
			} as unknown as UserType;

			// Mock findFirst to return a regular user
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});

			const resultNull = await mobilePhoneNumberResolver(
				parentNull,
				{},
				context,
			);
			const resultEmpty = await mobilePhoneNumberResolver(
				parentEmpty,
				{},
				context,
			);

			expect(resultNull).toBeNull();
			expect(resultEmpty).toBe("");
		});

		test("wraps generic Error in Internal Server Error", async () => {
			const _userId = faker.string.uuid();
			const { context, mocks } = createMockGraphQLContext(true, _userId);

			const parent = {
				id: _userId,
			} as unknown as UserType;

			const genericError = new Error("Something went wrong");
			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				genericError,
			);

			await expect(
				mobilePhoneNumberResolver(parent, {}, context),
			).rejects.toThrow("Internal server error");
		});

		test("rethrows TalawaGraphQLError as is", async () => {
			const _userId = faker.string.uuid();
			const { context, mocks } = createMockGraphQLContext(true, _userId);

			const parent = {
				id: _userId,
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
});
