import { faker } from "@faker-js/faker";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserCountryCodeResolver } from "~/src/graphql/types/User/countryCode";
import type { User as UserType } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("User.countryCode resolver", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should throw 'unauthenticated' error if user is not authenticated", async () => {
		const { context } = createMockGraphQLContext(false);
		const parent = {
			id: faker.string.uuid(),
			countryCode: "us",
		};

		await expect(
			UserCountryCodeResolver(parent as UserType, {}, context),
		).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthenticated",
				}),
			}),
		);
	});

	it("should throw 'unauthenticated' error if current user is not found", async () => {
		const { context, mocks } = createMockGraphQLContext(true);
		const parent = {
			id: faker.string.uuid(),
			countryCode: "us",
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(
			UserCountryCodeResolver(parent as UserType, {}, context),
		).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthenticated",
				}),
			}),
		);

		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledOnce();
	});

	it("should throw 'unauthorized_action' error if regular user accesses another user's countryCode", async () => {
		const currentUserId = faker.string.uuid();
		const { context, mocks } = createMockGraphQLContext(true, currentUserId);
		const parent = { id: faker.string.uuid(), countryCode: "us" };

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		await expect(
			UserCountryCodeResolver(parent as UserType, {}, context),
		).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action",
				}),
			}),
		);

		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledOnce();
	});

	it("should return countryCode if user is administrator", async () => {
		const currentUserId = faker.string.uuid();
		const { context, mocks } = createMockGraphQLContext(true, currentUserId);
		const parent = { id: faker.string.uuid(), countryCode: "us" };

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});

		const result = await UserCountryCodeResolver(
			parent as UserType,
			{},
			context,
		);
		expect(result).toBe("us");

		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledOnce();
	});

	it("should return countryCode if user accesses their own data", async () => {
		const currentUserId = faker.string.uuid();
		const { context, mocks } = createMockGraphQLContext(true, currentUserId);
		const parent = { id: currentUserId, countryCode: "gb" };

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const result = await UserCountryCodeResolver(
			parent as UserType,
			{},
			context,
		);
		expect(result).toBe("gb");

		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledOnce();
	});

	it("should return null when countryCode is null", async () => {
		const currentUserId = faker.string.uuid();
		const { context, mocks } = createMockGraphQLContext(true, currentUserId);
		const parent = { id: currentUserId, countryCode: null };

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const result = await UserCountryCodeResolver(
			parent as UserType,
			{},
			context,
		);
		expect(result).toBeNull();

		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledOnce();
	});

	it("should rethrow TalawaGraphQLError from database layer without logging", async () => {
		const { context, mocks } = createMockGraphQLContext(true);
		const parent = { id: faker.string.uuid(), countryCode: "us" };

		const talawaError = new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});

		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			talawaError,
		);

		await expect(
			UserCountryCodeResolver(parent as UserType, {}, context),
		).rejects.toBe(talawaError);
		expect(context.log.error).not.toHaveBeenCalled();
	});

	it("should log and wrap unknown database errors", async () => {
		const { context, mocks } = createMockGraphQLContext(true);
		const parent = { id: faker.string.uuid(), countryCode: "us" };

		const unknownError = new Error("DB crash");

		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			unknownError,
		);

		await expect(
			UserCountryCodeResolver(parent as UserType, {}, context),
		).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unexpected" }),
			}),
		);

		expect(context.log.error).toHaveBeenCalledWith(unknownError);
	});
});
