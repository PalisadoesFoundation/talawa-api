import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { TagFolder as TagFolderType } from "~/src/graphql/types/TagFolder/TagFolder";
import { resolveUpdater } from "~/src/graphql/types/TagFolder/updater";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("TagFolder Resolver - Updater Field", () => {
	let ctx: GraphQLContext;
	let mockTagFolder: TagFolderType;

	beforeEach(() => {
		const { context } = createMockGraphQLContext(true, "user-123");
		ctx = context;
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

		// Mock the DataLoader to verify it's not called
		ctx.dataloaders.user.load = vi.fn();

		const result = await resolveUpdater(mockTagFolder, {}, ctx);
		expect(result).toBeNull();
		expect(ctx.dataloaders.user.load).not.toHaveBeenCalled();
	});

	it("should fetch and return updater if updaterId exists", async () => {
		const updaterUser = {
			id: "user-456",
			role: "member",
		};

		mockTagFolder.updaterId = "user-456";
		// Mock the DataLoader's load function
		ctx.dataloaders.user.load = vi.fn().mockResolvedValue(updaterUser);

		const result = await resolveUpdater(mockTagFolder, {}, ctx);
		expect(result).toEqual(updaterUser);
		expect(ctx.dataloaders.user.load).toHaveBeenCalledWith("user-456");
	});

	it("should throw unexpected error if updater user does not exist", async () => {
		mockTagFolder.updaterId = "user-456";
		// DataLoader returns null for non-existent users
		ctx.dataloaders.user.load = vi.fn().mockResolvedValue(null);

		await expect(async () => {
			await resolveUpdater(mockTagFolder, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);
	});
});
