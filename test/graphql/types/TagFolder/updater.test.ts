import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { TagFolder as TagFolderType } from "~/src/graphql/types/TagFolder/TagFolder";
import { resolveUpdater } from "~/src/graphql/types/TagFolder/updater";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("TagFolder Resolver - Updater Field", () => {
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
			id: "folder-123",
			name: "Test Folder",
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "user-123",
			updaterId: "user-123",
			organizationId: "org-123",
			parentFolderId: null,
		} as TagFolderType;
	});

	it("should return null if updaterId is null", async () => {
		mockTagFolder.updaterId = null;

		const result = await resolveUpdater(mockTagFolder, {}, ctx);
		expect(result).toBeNull();
	});

	it("should fetch and return updater if updaterId exists", async () => {
		const updaterUser = {
			id: "user-456",
			role: "member",
		};

		mockTagFolder.updaterId = "user-456";
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			updaterUser,
		);

		const result = await resolveUpdater(mockTagFolder, {}, ctx);
		expect(result).toEqual(updaterUser);
	});

	it("should throw unexpected error if updater user does not exist", async () => {
		mockTagFolder.updaterId = "user-456";
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			undefined,
		);

		await expect(async () => {
			await resolveUpdater(mockTagFolder, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);
	});
});
