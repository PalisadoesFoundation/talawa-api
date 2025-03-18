import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Community } from "~/src/graphql/types/Community/Community";
import { communityUpdater } from "~/src/graphql/types/Community/updater";
import type { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../../../src/graphql/context";
import { createMockUser, type DeepPartial } from "test/_Mocks_/mockUser";



describe("Community Resolver - Updater Field", () => {
	let ctx: GraphQLContext;
	let mockUser:DeepPartial<User>;
	let mockCommunity: Community;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { mocks: newMocks, context } = createMockGraphQLContext(true, "123");
		mockUser = createMockUser();

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

		ctx = context;
		mocks = newMocks;
	});

	it("should throw an unauthenticated error if the user is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(communityUpdater(mockCommunity, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("should throw forbidden error if the user does not exist in the database", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(communityUpdater(mockCommunity, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "forbidden_action" },
			}),
		);
	});

	it("should throw unauthorized error if the user is not an administrator", async () => {
		const nonAdminUser = createMockUser({ role: "regular" });
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			nonAdminUser,
		);

		await expect(communityUpdater(mockCommunity, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should return null when updaterId is null", async () => {
		const communityWithNullUpdater = { ...mockCommunity, updaterId: null };

		await expect(
			communityUpdater(communityWithNullUpdater, {}, ctx),
		).resolves.toBeNull();
	});

	it("should return the current user if updaterId matches the authenticated user", async () => {
		const communityWithSameUpdater = { ...mockCommunity, updaterId: "123" };
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(mockUser);

		const result = await communityUpdater(communityWithSameUpdater, {}, ctx);
		expect(result).toEqual(mockUser);
	});

	it("should fetch and return the correct updater user when updaterId is different", async () => {
		const updaterUser = createMockUser({
			id: "456",
			name: "Jane Updater",
			role: "regular",
		});

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(mockUser) // First query for the current user
			.mockResolvedValueOnce(updaterUser); // Second query for the updater user

		const result = await communityUpdater(mockCommunity, {}, ctx);
		expect(result).toEqual(updaterUser);
		expect(ctx.drizzleClient.query.usersTable.findFirst).toHaveBeenCalledTimes(
			2,
		);
	});

	it("should log a warning and throw an error if the updater user does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(mockUser) // First query for the current user
			.mockResolvedValueOnce(undefined); // Second query returns undefined

		const logWarnSpy = vi.spyOn(ctx.log, "warn");

		await expect(communityUpdater(mockCommunity, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);

		expect(logWarnSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for a community's updater id that isn't null.",
		);
	});
});
