import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { tagFolderCreatorResolver } from "~/src/graphql/types/TagFolder/creator";
import type { TagFolder as TagFolderType } from "~/src/graphql/types/TagFolder/TagFolder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("TagFolder creator Resolver Tests", () => {
	let ctx: GraphQLContext;
	let mockTagFolder: TagFolderType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
		mockTagFolder = {
			id: "folder-1",
			creatorId: "creator-123",
			organizationId: "org-1",
		} as TagFolderType;
	});

	it("Should return null if creatorId is  null", async () => {
		mockTagFolder.creatorId = null;
		const result = await tagFolderCreatorResolver(mockTagFolder, {}, ctx);
		expect(result).toBeNull();
		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).not.toHaveBeenCalled();
	});

	it("should log error and throw unexpected if creatorId is set but user not found", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(
			tagFolderCreatorResolver(mockTagFolder, {}, ctx),
		).rejects.toMatchObject({
			extensions: { code: "unexpected" },
		});
		expect(ctx.log.error).toHaveBeenCalledWith(
			expect.stringContaining(
				"Postgres select operation returned an empty array for a tag folder's creator id that isn't null.",
			),
		);
	});

	it("Should return the user if creator exists", async () => {
		const mockUser = { id: "creator-123", username: "creator" };
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(mockUser);

		const result = await tagFolderCreatorResolver(mockTagFolder, {}, ctx);

		expect(result).toEqual(mockUser);
		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledTimes(1);
	});

	it("should handle database errors and throw Internal Server Error", async () => {
		const dbError = new Error("DB Connection Failed");
		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(dbError);

		await expect(
			tagFolderCreatorResolver(mockTagFolder, {}, ctx),
		).rejects.toMatchObject({
			message: "Internal server error",
			extensions: { code: "unexpected" },
		});
		expect(ctx.log.error).toHaveBeenCalledWith(dbError);
	});

	it("should re-throw TalawaGraphQLError without wrapping", async () => {
		const customError = new TalawaGraphQLError({
			message: "Custom error",
			extensions: { code: "unexpected" },
		});

		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			customError,
		);

		await expect(
			tagFolderCreatorResolver(mockTagFolder, {}, ctx),
		).rejects.toThrow(customError);

		expect(ctx.log.error).not.toHaveBeenCalled();
	});
});
