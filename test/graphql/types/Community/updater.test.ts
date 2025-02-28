import { createMockGraphQLContext } from "test/MockContext/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Community } from "~/src/graphql/types/Community/Community";
import { CommunityResolver } from "~/src/graphql/types/Community/Community";
import type { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../../../src/graphql/context";

type DeepPartial<T> = Partial<T>;

describe("Community Resolver - Updater Field", () => {
	let ctx: GraphQLContext;
	let mockUser: DeepPartial<User>;
	let mockCommunity: Community;

	beforeEach(() => {
		mockUser = {
			id: "123",
			name: "John Doe",
			role: "administrator",
			createdAt: new Date(),
			updatedAt: null,
		};

		mockCommunity = {
			id: "community-123",
			name: "Test Community",
			createdAt: new Date(),
			updatedAt: new Date(),
			updaterId: "456",
			facebookURL: null,
			githubURL: null,
			inactivityTimeoutDuration: null,
			instagramURL: null,
			linkedinURL: null,
			logoMimeType: null,
			logoName: null,
			redditURL: null,
			slackURL: null,
			websiteURL: null,
			xURL: null,
			youtubeURL: null,
		};

		ctx = createMockGraphQLContext(true, "123");
		console.log(ctx);
	});

	it("should return null when updaterId is null", async () => {
		const nullUpdaterCommunity = {
			...mockCommunity,
			updaterId: null,
		};

		const result = await CommunityResolver.updater(
			nullUpdaterCommunity,
			{},
			ctx,
		);
		expect(result).toBeNull();
	});

	it("should throw unauthenticated error", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(
			CommunityResolver.updater(mockCommunity, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({
				message: "User is not authenticated",
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("should make correct database queries with expected parameters", async () => {
		const updaterUser = {
			id: "456",
			name: "Jane Updater",
			role: "user",
			createdAt: new Date(),
			updatedAt: null,
		};

		(ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>)
			.mockResolvedValueOnce(mockUser)
			.mockResolvedValueOnce(updaterUser);

		await CommunityResolver.updater(mockCommunity, {}, ctx);

		expect(ctx.drizzleClient.query.usersTable.findFirst).toHaveBeenCalledWith({
			where: expect.any(Function),
		});
		expect(ctx.drizzleClient.query.usersTable.findFirst).toHaveBeenCalledTimes(
			2,
		);
	});

	it("should successfully return updater user when all conditions are met", async () => {
		const updaterUser = {
			id: "456",
			name: "Jane Updater",
			role: "user",
			createdAt: new Date(),
			updatedAt: null,
		};

		(ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>)
			.mockResolvedValueOnce(mockUser)
			.mockResolvedValueOnce(updaterUser);

		const result = await CommunityResolver.updater(mockCommunity, {}, ctx);

		expect(result).toEqual(updaterUser);
		expect(ctx.drizzleClient.query.usersTable.findFirst).toHaveBeenCalledTimes(
			2,
		);
	});
	it("should handle database errors gracefully", async () => {
		const dbError = new Error("Database connection failed");

		(ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>)
			.mockRejectedValueOnce(dbError)
			.mockResolvedValueOnce(mockUser);

		const logErrorSpy = vi.spyOn(ctx.log, "error");

		await expect(
			CommunityResolver.updater(mockCommunity, {}, ctx),
		).rejects.toThrow(dbError);

		expect(logErrorSpy).toHaveBeenCalledWith(
			"Database error in community updater resolver",
			{ error: dbError },
		);
	});

	it("should fetch different user when updaterId doesn't match current user", async () => {
		const differentUpdaterCommunity = {
			...mockCommunity,
			updaterId: "different-id-789",
		};

		const differentUser: DeepPartial<User> = {
			...mockUser,
			id: "different-id-789",
			name: "Jane Smith",
		};

		(ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>)
			.mockResolvedValueOnce(mockUser)
			.mockResolvedValueOnce(differentUser);
		const result = await CommunityResolver.updater(
			differentUpdaterCommunity,
			{},
			ctx,
		);

		expect(result).toEqual(differentUser);

		expect(ctx.drizzleClient.query.usersTable.findFirst).toHaveBeenCalledTimes(
			2,
		);

		expect(
			ctx.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenNthCalledWith(2, {
			where: expect.any(Function),
		});
	});

	it("should log warning and throw error when updater is not found", async () => {
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue(undefined);

		const testCommunity = {
			...mockCommunity,
			updaterId: "non-existent-id",
		};

		await expect(
			CommunityResolver.updater(testCommunity, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({
				message: "Updater user not found",
				extensions: {
					code: "arguments_associated_resources_not_found",
					issues: [{ argumentPath: ["updaterId"] }],
				},
			}),
		);

		expect(ctx.log.warn).toHaveBeenCalledWith(
			`No user found for updaterId: ${testCommunity.updaterId}`,
		);
	});

	it("should handle database timeout errors", async () => {
		const timeoutError = new Error("Database timeout");
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockRejectedValue(timeoutError);

		await expect(
			CommunityResolver.updater(mockCommunity, {}, ctx),
		).rejects.toThrow(timeoutError);

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Database error in community updater resolver",
			{ error: timeoutError },
		);
	});
});
