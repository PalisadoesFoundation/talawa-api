import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { resolveUpdatedAt } from "../../../../src/graphql/types/Chat/updatedAt";

const mockParent = {
	id: "chat_1",
	organizationId: "org_1",
	updatedAt: new Date("2023-10-01T00:00:00Z"),
	createdAt: new Date("2023-10-01T00:00:00Z"),
	name: "Amaan",
	description: "chat description",
	creatorId: "creator_1",
	avatarMimeType: null,
	avatarName: "avatar_name",
	updaterId: "updater_1",
};

describe("Chat.updatedAt resolver", () => {
	let authenticatedContext: ReturnType<
		typeof createMockGraphQLContext
	>["context"];
	let unauthenticatedContext: ReturnType<
		typeof createMockGraphQLContext
	>["context"];
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		authenticatedContext = context;
		unauthenticatedContext = createMockGraphQLContext(false).context;
		mocks = newMocks;
	});
	it("throws unauthenticated error when user is not authenticated", async () => {
		await expect(
			resolveUpdatedAt(mockParent, {}, unauthenticatedContext),
		).rejects.toThrow(
			expect.objectContaining({
				message: expect.stringMatching(/authenticated/i),
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("throws unauthenticated error when user is not found", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(
			resolveUpdatedAt(mockParent, {}, authenticatedContext),
		).rejects.toThrow(TalawaGraphQLError);
	});

	it("throws unauthorized error when user lacks permissions", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
			chatMembershipsWhereMember: [],
			organizationMembershipsWhereMember: [],
		});

		await expect(
			resolveUpdatedAt(mockParent, {}, authenticatedContext),
		).rejects.toThrow(TalawaGraphQLError);
	});

	it("returns updatedAt when user is global admin", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
			chatMembershipsWhereMember: [],
			organizationMembershipsWhereMember: [],
		});

		const result = await resolveUpdatedAt(mockParent, {}, authenticatedContext);
		expect(result).toEqual(mockParent.updatedAt);
	});

	it("returns updatedAt when user is the creator of the chat", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
			chatMembershipsWhereMember: [],
			organizationMembershipsWhereMember: [],
		});

		// Mock parent with current user as creator
		const mockParentWithCreator = {
			...mockParent,
			creatorId: "user-123", // Same as authenticated user ID
		};

		const result = await resolveUpdatedAt(
			mockParentWithCreator,
			{},
			authenticatedContext,
		);
		expect(result).toEqual(mockParentWithCreator.updatedAt);
	});

	it("returns updatedAt when user is a chat member", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		mocks.drizzleClient.query.chatMembershipsTable.findFirst.mockResolvedValue({
			chatId: "chat_1",
		});

		const result = await resolveUpdatedAt(mockParent, {}, authenticatedContext);
		expect(result).toEqual(mockParent.updatedAt);
	});

	it("throws unauthorized error when user is not creator, not admin, and not chat member", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		mocks.drizzleClient.query.chatMembershipsTable.findFirst.mockResolvedValue(
			undefined,
		);

		await expect(
			resolveUpdatedAt(mockParent, {}, authenticatedContext),
		).rejects.toThrow(
			expect.objectContaining({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});
});
