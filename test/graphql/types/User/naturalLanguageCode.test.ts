import { faker } from "@faker-js/faker";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveNaturalLanguageCode } from "~/src/graphql/types/User/naturalLanguageCode";
import type { User as UserType } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("User field naturalLanguageCode", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should throw unauthenticated error when user is not authenticated", async () => {
		const { context } = createMockGraphQLContext(false);

		const parent = {
			id: faker.string.uuid(),
			naturalLanguageCode: "en",
		} as unknown as UserType;

		await expect(
			resolveNaturalLanguageCode(parent, {}, context),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("should throw unauthenticated error when current user is not found in database", async () => {
		const userId = faker.string.uuid();
		const { context, mocks } = createMockGraphQLContext(true, userId);

		const parent = {
			id: faker.string.uuid(),
			naturalLanguageCode: "en",
		} as unknown as UserType;

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			undefined,
		);

		await expect(
			resolveNaturalLanguageCode(parent, {}, context),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);

		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledOnce();
	});

	it("should throw unauthorized_action error when non-admin user accesses another user's data", async () => {
		const userId = faker.string.uuid();
		const { context, mocks } = createMockGraphQLContext(true, userId);

		const parent = {
			id: faker.string.uuid(),
			naturalLanguageCode: "en",
		} as unknown as UserType;

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			role: "regular",
		});

		await expect(
			resolveNaturalLanguageCode(parent, {}, context),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);

		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledOnce();
	});

	it("should return naturalLanguageCode when admin accesses another user's data", async () => {
		const userId = faker.string.uuid();
		const { context, mocks } = createMockGraphQLContext(true, userId);

		const parent = {
			id: faker.string.uuid(),
			naturalLanguageCode: "es",
		} as unknown as UserType;

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			role: "administrator",
		});

		const result = await resolveNaturalLanguageCode(parent, {}, context);
		expect(result).toBe("es");

		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledOnce();
	});

	it("should return naturalLanguageCode when user accesses their own data", async () => {
		const userId = faker.string.uuid();
		const { context, mocks } = createMockGraphQLContext(true, userId);

		const parent = {
			id: userId,
			naturalLanguageCode: "de",
		} as unknown as UserType;

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			role: "regular",
		});

		const result = await resolveNaturalLanguageCode(parent, {}, context);
		expect(result).toBe("de");

		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledOnce();
	});

	it("should return null when naturalLanguageCode is null", async () => {
		const userId = faker.string.uuid();
		const { context, mocks } = createMockGraphQLContext(true, userId);

		const parent = {
			id: userId,
			naturalLanguageCode: null,
		} as unknown as UserType;

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			role: "regular",
		});

		const result = await resolveNaturalLanguageCode(parent, {}, context);
		expect(result).toBeNull();

		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledOnce();
	});

	it("should return naturalLanguageCode when admin accesses their own data", async () => {
		const userId = faker.string.uuid();
		const { context, mocks } = createMockGraphQLContext(true, userId);

		const parent = {
			id: userId,
			naturalLanguageCode: "fr",
		} as unknown as UserType;

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			role: "administrator",
		});

		const result = await resolveNaturalLanguageCode(parent, {}, context);
		expect(result).toBe("fr");

		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledOnce();
	});
});
