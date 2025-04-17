import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { resolveUpdatedAt } from "../../../../src/graphql/types/Chat/updatedAt";

const mockParent = {
	id: "chat_1",
	isGroup: false,
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

	it("returns updatedAt when user is an administrator in the organization and not global administrator", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
			chatMembershipsWhereMember: [{ role: "regular" }],
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		});

		const result = await resolveUpdatedAt(mockParent, {}, authenticatedContext);
		expect(result).toEqual(mockParent.updatedAt);
	});

	it("returns updatedAt when user is a chat administrator and not global administrator", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
			chatMembershipsWhereMember: [{ role: "administrator" }],
			organizationMembershipsWhereMember: [{ role: "regular" }],
		});

		const result = await resolveUpdatedAt(mockParent, {}, authenticatedContext);
		expect(result).toEqual(mockParent.updatedAt);
	});

	it("returns updatedAt when user is both organization and chat admin", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
			chatMembershipsWhereMember: [{ role: "administrator" }],
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		});

		const result = await resolveUpdatedAt(mockParent, {}, authenticatedContext);
		expect(result).toEqual(mockParent.updatedAt);
	});
});
