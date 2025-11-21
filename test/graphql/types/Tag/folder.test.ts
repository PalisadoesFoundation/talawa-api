import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { Tag as TagType } from "~/src/graphql/types/Tag/Tag";
import { resolveFolder } from "~/src/graphql/types/Tag/folder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

type MockUser = {
	id: string;
	role: "member" | "administrator";
	organizationMembershipsWhereMember: Array<{
		role: "member" | "administrator";
		organizationId: string;
	}>;
};

describe("Tag.folder resolver - unit tests", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let mockTag: TagType;

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(true, "user-123");
		ctx = context;
		mocks = newMocks;

		mockTag = {
			id: "550e8400-e29b-41d4-a716-446655440000",
			name: "Urgent",
			creatorId: "123e4567-e89b-12d3-a456-426614174000",
			updaterId: "123e4567-e89b-12d3-a456-426614174000",
			folderId: "234e5678-f89c-12d3-a456-426614174111",
			organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
			createdAt: new Date("2024-02-07T10:30:00.000Z"),
			updatedAt: new Date("2024-02-07T12:00:00.000Z"),
		};

		
        mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
            (async ({ with: withClause }: any) => {
               if (withClause?.organizationMembershipsWhereMember?.where) {
                   const whereCallback = withClause.organizationMembershipsWhereMember.where;
                   const mockFields = { organizationId: "test-org-id" }; 
                   const mockOperators = { eq: (a: any, b: any) => a === b };
                   const result = whereCallback(mockFields, mockOperators);
                   expect(result).toBe(mockFields.organizationId === mockTag.organizationId);
			   }
            return undefined;
            }) as any,
		);

	});

	describe("Authentication & Authorization", () => {
		it("throws unauthenticated if client not authenticated", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(resolveFolder(mockTag, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});

		it("throws unauthenticated if current user not found", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

			await expect(resolveFolder(mockTag, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);

			expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalled();
		});

		it("throws unauthorized_action when user has no org membership and not system admin", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(mockUserData);

			await expect(resolveFolder(mockTag, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
			);
		});

		it("throws unauthorized_action when user has membership but membership role is member (not admin)", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [
					{ role: "member", organizationId: mockTag.organizationId },
				],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(mockUserData);

			await expect(resolveFolder(mockTag, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
			);
		});

		it("allows system administrator full access", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(mockUserData);
			mocks.drizzleClient.query.tagFoldersTable.findFirst.mockResolvedValue({  
		       id: mockTag.folderId as string,  
		       name: "Test Folder",  
	        }); 

			await expect(resolveFolder(mockTag, {}, ctx)).resolves.toBeDefined();
			const result = await resolveFolder(mockTag, {}, ctx);
			expect(result).toBeDefined(); 
			expect(result?.id).toBe(mockTag.folderId); 
		});

		it("allows organization administrator access via membership", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [
					{ role: "administrator", organizationId: mockTag.organizationId },
				],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(mockUserData);
			mocks.drizzleClient.query.tagFoldersTable.findFirst.mockResolvedValue({  
                id: mockTag.folderId as string,  
                name: "Test Folder",  
            });

			await expect(resolveFolder(mockTag, {}, ctx)).resolves.toBeDefined();
			const result = await resolveFolder(mockTag, {}, ctx);  
            expect(result).toBeDefined();  
            expect(result?.id).toBe(mockTag.folderId);
		});
	});

	describe("Folder retrieval logic", () => {
		it("returns null when tag.folderId is null", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(mockUserData);

			const parentWithNullFolder: TagType = { ...mockTag, folderId: null };

			const result = await resolveFolder(parentWithNullFolder, {}, ctx);
			expect(result).toBeNull();
		});

		it("throws unexpected and logs when folder not found though folderId non-null", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			const findFirst = mocks.drizzleClient.query.usersTable.findFirst;
			findFirst.mockResolvedValueOnce(mockUserData);

			mocks.drizzleClient.query.tagFoldersTable.findFirst.mockResolvedValue(undefined);

			await expect(resolveFolder(mockTag, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);

			expect(ctx.log.error).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for a tag's folder id that isn't null.",
			);
		});

		it("returns the existing folder when found", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [
					{ role: "administrator", organizationId: mockTag.organizationId },
				],
			};

			const folder = { id: mockTag.folderId as string, name: "FolderName" };

			const findFirst = mocks.drizzleClient.query.usersTable.findFirst;
			findFirst.mockResolvedValueOnce(mockUserData);

			mocks.drizzleClient.query.tagFoldersTable.findFirst.mockResolvedValue(folder);

			const result = await resolveFolder(mockTag, {}, ctx);
			expect(result).toEqual(folder);
		});
	});
});
