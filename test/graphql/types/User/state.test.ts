import { faker } from "@faker-js/faker";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserStateResolver } from "~/src/graphql/types/User/state";
import type { User as UserType } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("User.state resolver", () => {
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
			state: faker.location.state(),
		};

		await expect(
			UserStateResolver(parent as UserType, {}, context),
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
			state: faker.location.state(),
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(
			UserStateResolver(parent as UserType, {}, context),
		).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthenticated",
				}),
			}),
		);
	});

	it("should throw 'unauthorized_action' error if regular user accesses another user's state", async () => {
		const currentUserId = faker.string.uuid();
		const { context, mocks } = createMockGraphQLContext(true, currentUserId);
		const parent = { id: faker.string.uuid(), state: faker.location.state() }; // Different ID

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		await expect(
			UserStateResolver(parent as UserType, {}, context),
		).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action",
				}),
			}),
		);
	});

	it("should return state if user is administrator", async () => {
		const currentUserId = faker.string.uuid();
		const { context, mocks } = createMockGraphQLContext(true, currentUserId);
		// Different ID, but admin role allows access
		const parent = { id: faker.string.uuid(), state: faker.location.state() };

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});

		const result = await UserStateResolver(parent as UserType, {}, context);
		expect(result).toBe(parent.state);
	});

	it("should return state if user accesses their own data", async () => {
		const currentUserId = faker.string.uuid();
		const { context, mocks } = createMockGraphQLContext(true, currentUserId);
		const parent = { id: currentUserId, state: faker.location.state() }; // Same ID

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const result = await UserStateResolver(parent as UserType, {}, context);
		expect(result).toBe(parent.state);
	});

	it("should escape HTML characters in the returned state", async () => {
		const currentUserId = faker.string.uuid();
		const { context, mocks } = createMockGraphQLContext(true, currentUserId);
		const unsafeState = "<script>alert('xss')</script>";
		const parent = { id: currentUserId, state: unsafeState };

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const result = await UserStateResolver(parent as UserType, {}, context);
		expect(result).not.toContain("<script>");
		expect(result).toContain("&lt;script&gt;");
	});

	it("should return null when state is null", async () => {
		const currentUserId = faker.string.uuid();
		const { context, mocks } = createMockGraphQLContext(true, currentUserId);
		const parent = { id: currentUserId, state: null };

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const result = await UserStateResolver(parent as UserType, {}, context);
		expect(result).toBeNull();
	});

	it("should return empty string when state is empty", async () => {
		const currentUserId = faker.string.uuid();
		const { context, mocks } = createMockGraphQLContext(true, currentUserId);
		const parent = { id: currentUserId, state: "" };

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const result = await UserStateResolver(parent as UserType, {}, context);
		expect(result).toBe("");
	});

	it("should rethrow TalawaGraphQLError from database layer without logging", async () => {
		const { context, mocks } = createMockGraphQLContext(true);
		const parent = { id: faker.string.uuid(), state: faker.location.state() };

		const talawaError = new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});

		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			talawaError,
		);

		await expect(
			UserStateResolver(parent as UserType, {}, context),
		).rejects.toBe(talawaError);
		expect(context.log.error).not.toHaveBeenCalled();
	});

	it("should log and wrap unknown database errors", async () => {
		const { context, mocks } = createMockGraphQLContext(true);
		const parent = { id: faker.string.uuid(), state: faker.location.state() };

		const unknownError = new Error("DB crash");

		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			unknownError,
		);

		await expect(
			UserStateResolver(parent as UserType, {}, context),
		).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unexpected" }),
			}),
		);

		expect(context.log.error).toHaveBeenCalledWith(unknownError);
	});
});
