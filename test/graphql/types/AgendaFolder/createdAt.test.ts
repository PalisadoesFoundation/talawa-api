import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaFolder as AgendaFolderType } from "~/src/graphql/types/AgendaFolder/AgendaFolder";
import { resolveCreatedAt } from "~/src/graphql/types/AgendaFolder/createdAt";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import "~/src/graphql/types/AgendaFolder/AgendaFolder";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";

type MockUser = {
	id: string;
	role: "member" | "administrator";
};
describe("AgendaFolder CreatedAt Resolver Tests", () => {
	let ctx: GraphQLContext;
	let mockAgendaFolder: AgendaFolderType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);

		ctx = context;
		mocks = newMocks;

		mockAgendaFolder = {
			id: "folder-123",
			name: "Main Folder",
			description: "Agenda folder",
			eventId: "event-123",
			organizationId: "org-123",
			createdAt: new Date("2024-01-01T10:00:00Z"),
			updatedAt: null,
			creatorId: "user-123",
			updaterId: null,
		} as AgendaFolderType;
	});

	it("should throw unauthenticated error if user is not logged in", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(resolveCreatedAt(mockAgendaFolder, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("should throw unauthenticated error if current user does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(resolveCreatedAt(mockAgendaFolder, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("should throw unauthorized error if user is not org member", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "member",
		} satisfies MockUser);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			id: "event-123",
			startAt: new Date(),
			organization: {
				countryCode: "IN",
				membershipsWhereOrganization: [],
			},
		});

		await expect(resolveCreatedAt(mockAgendaFolder, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action_on_arguments_associated_resources",
					issues: [{ argumentPath: [] }],
				},
			}),
		);
	});

	it("should throw unauthorized error if user is org member but not admin", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "member",
		} satisfies MockUser);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			id: "event-123",
			startAt: new Date(),
			organization: {
				countryCode: "IN",
				membershipsWhereOrganization: [{ role: "member" }],
			},
		});

		await expect(resolveCreatedAt(mockAgendaFolder, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action_on_arguments_associated_resources",
					issues: [{ argumentPath: [] }],
				},
			}),
		);
	});

	it("should return createdAt if user is organization administrator", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "member",
		} satisfies MockUser);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			id: "event-123",
			startAt: new Date(),
			organization: {
				countryCode: "IN",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		});

		const result = await resolveCreatedAt(mockAgendaFolder, {}, ctx);
		expect(result).toBe(mockAgendaFolder.createdAt);
	});

	it("should return createdAt if user is global administrator", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "administrator",
		} satisfies MockUser);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			id: "event-123",
			startAt: new Date(),
			organization: {
				countryCode: "IN",
				membershipsWhereOrganization: [],
			},
		});

		const result = await resolveCreatedAt(mockAgendaFolder, {}, ctx);
		expect(result).toBe(mockAgendaFolder.createdAt);
	});

	it("should throw unexpected error if event does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "administrator",
		} satisfies MockUser);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
			undefined,
		);

		await expect(resolveCreatedAt(mockAgendaFolder, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);
	});

	it("should return exact createdAt value from parent", async () => {
		const exactDate = new Date("2023-12-31T23:59:59.999Z");
		mockAgendaFolder.createdAt = exactDate;

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "administrator",
		} satisfies MockUser);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			id: "event-123",
			startAt: new Date(),
			organization: {
				countryCode: "IN",
				membershipsWhereOrganization: [],
			},
		});

		const result = await resolveCreatedAt(mockAgendaFolder, {}, ctx);
		expect(result).toBe(exactDate);
	});

	it("should propagate database errors", async () => {
		const dbError = new Error("DB failure");
		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(dbError);

		await expect(resolveCreatedAt(mockAgendaFolder, {}, ctx)).rejects.toThrow(
			dbError,
		);
	});

	it("should verify usersTable query structure", async () => {
		const mockUser: MockUser = {
			id: "user-123",
			role: "administrator",
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(mockUser);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			id: "event-123",
			startAt: new Date(),
			organization: {
				countryCode: "IN",
				membershipsWhereOrganization: [],
			},
		});

		await resolveCreatedAt(mockAgendaFolder, {}, ctx);

		expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				columns: { role: true },
				where: expect.any(Function),
			}),
		);
	});
});
