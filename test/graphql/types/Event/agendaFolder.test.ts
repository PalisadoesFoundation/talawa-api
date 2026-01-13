import type {
	GraphQLFieldResolver,
	GraphQLObjectType,
	GraphQLResolveInfo,
} from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { Event as EventType } from "~/src/graphql/types/Event/Event";

// Utility to create base64url-encoded GraphQL cursor
const createCursor = (data: Record<string, unknown>): string =>
	Buffer.from(JSON.stringify(data)).toString("base64url");

interface Connection {
	edges: Array<{ node: Record<string, unknown>; cursor: string }>;
	pageInfo: {
		hasNextPage: boolean;
		hasPreviousPage: boolean;
		startCursor?: string | null;
		endCursor?: string | null;
	};
}

type AgendaFoldersResolver = GraphQLFieldResolver<
	EventType,
	GraphQLContext,
	Record<string, unknown>,
	unknown
>;

describe("Event agendaFolders Resolver", () => {
	let mockEvent: EventType;
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let agendaFoldersResolver: AgendaFoldersResolver;
	const now = new Date("2026-01-13T12:00:00Z");
	const mockAgendaFolders = [
		{
			id: "00000000-0000-4000-8000-000000000001",
			name: "Folder A",
			parentFolderId: null,
			eventId: "00000000-0000-4000-8000-000000000100",
			isAgendaItemFolder: false,
			createdAt: now,
			updatedAt: now,
			creatorId: "00000000-0000-4000-8000-000000000200",
			updaterId: null,
		},
		{
			id: "00000000-0000-4000-8000-000000000002",
			name: "Folder B",
			parentFolderId: null,
			eventId: "00000000-0000-4000-8000-000000000100",
			isAgendaItemFolder: false,
			createdAt: now,
			updatedAt: now,
			creatorId: "00000000-0000-4000-8000-000000000200",
			updaterId: null,
		},
		{
			id: "00000000-0000-4000-8000-000000000003",
			name: "Folder C",
			parentFolderId: null,
			eventId: "00000000-0000-4000-8000-000000000100",
			isAgendaItemFolder: true,
			createdAt: now,
			updatedAt: now,
			creatorId: "00000000-0000-4000-8000-000000000200",
			updaterId: null,
		},
	];

	const mockResolveInfo = {} as unknown as GraphQLResolveInfo;

	beforeAll(() => {
		const type = schema.getType("Event") as GraphQLObjectType;
		const field = type.getFields().agendaFolders;
		if (!field) throw new Error("agendaFolders field not found");
		agendaFoldersResolver = field.resolve as AgendaFoldersResolver;
	});

	beforeEach(() => {
		const setup = createMockGraphQLContext(true, "user-123");
		ctx = setup.context;
		mocks = setup.mocks;
		mockEvent = {
			id: "00000000-0000-4000-8000-000000000100",
			name: "Test Event",
			description: "Test event description",
			startAt: new Date("2024-03-10T09:00:00Z"),
			endAt: new Date("2024-03-10T12:00:00Z"),
			organizationId: "00000000-0000-4000-8000-000000000300",
			createdAt: new Date("2024-03-01T00:00:00Z"),
			creatorId: "user-123",
			updatedAt: null,
			updaterId: null,
			allDay: false,
			isPublic: true,
			isRegisterable: true,
			isInviteOnly: false,
			location: null,
			isRecurringEventTemplate: false,
			attachments: [],
		} as EventType;
	});

	describe("happy path", () => {
		it("returns all agenda folders with correct connection fields (forward pagination, no cursor)", async () => {
			mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue(
				mockAgendaFolders,
			);
			const result = (await agendaFoldersResolver(
				mockEvent,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			)) as Connection;
			expect(result.edges).toHaveLength(3);
			expect(result.edges.map((e) => e.node.name)).toEqual([
				"Folder A",
				"Folder B",
				"Folder C",
			]);
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
			expect(result.pageInfo.startCursor).toBeDefined();
			expect(result.pageInfo.endCursor).toBeDefined();
		});

		it("returns all agenda folders with correct connection fields (backward pagination, no cursor)", async () => {
			const mockAgendaFoldersDesc = [...mockAgendaFolders].reverse();
			mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue(
				mockAgendaFoldersDesc,
			);
			const result = (await agendaFoldersResolver(
				mockEvent,
				{ last: 3 },
				ctx,
				mockResolveInfo,
			)) as Connection;
			expect(result.edges).toHaveLength(3);
			expect(result.edges.map((e) => e.node.name)).toEqual([
				"Folder A",
				"Folder B",
				"Folder C",
			]);
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
			expect(result.pageInfo.startCursor).toBeDefined();
			expect(result.pageInfo.endCursor).toBeDefined();
		});

		it("returns correct folders after a valid forward cursor", async () => {
			const folderB = mockAgendaFolders[1];
			if (!folderB) throw new Error("folderB is undefined");
			const cursorData = { id: folderB.id, name: folderB.name };
			const validCursor = createCursor(cursorData);
			const folderC = mockAgendaFolders[2];
			if (!folderC) throw new Error("folderC is undefined");
			mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue([
				folderC,
			]);
			const result = (await agendaFoldersResolver(
				mockEvent,
				{ first: 1, cursor: validCursor },
				ctx,
				mockResolveInfo,
			)) as Connection;
			expect(result.edges).toHaveLength(1);
			expect(result.edges[0]?.node?.name).toBe("Folder C");
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
			expect(result.pageInfo.startCursor).toBeDefined();
			expect(result.pageInfo.endCursor).toBeDefined();
		});

		it("returns correct folders after a valid backward cursor", async () => {
			const folderB = mockAgendaFolders[1];
			if (!folderB) throw new Error("folderB is undefined");
			const cursorData = { id: folderB.id, name: folderB.name };
			const validCursor = createCursor(cursorData);
			const folderA = mockAgendaFolders[0];
			if (!folderA) throw new Error("folderA is undefined");
			mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue([
				folderA,
			]);
			const result = (await agendaFoldersResolver(
				mockEvent,
				{ last: 1, cursor: validCursor },
				ctx,
				mockResolveInfo,
			)) as Connection;
			expect(result.edges).toHaveLength(1);
			expect(result.edges[0]?.node?.name).toBe("Folder A");
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
			expect(result.pageInfo.startCursor).toBeDefined();
			expect(result.pageInfo.endCursor).toBeDefined();
		});

		it("returns empty connection when no agenda folders (forward)", async () => {
			mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue(
				[],
			);
			const result = (await agendaFoldersResolver(
				mockEvent,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			)) as Connection;
			expect(result.edges).toHaveLength(0);
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
			expect(result.pageInfo.startCursor).toBeNull();
		});
	});

	describe("validation", () => {
		it("throws TalawaGraphQLError when arguments are invalid (first is string)", async () => {
			const invalidArgs = { first: "not-a-number" };
			await expect(
				agendaFoldersResolver(mockEvent, invalidArgs, ctx, mockResolveInfo),
			).rejects.toMatchObject({
				extensions: expect.objectContaining({
					code: "invalid_arguments",
					issues: expect.any(Array),
				}),
			});
		});

		it("throws TalawaGraphQLError when both first and last are missing", async () => {
			await expect(
				agendaFoldersResolver(mockEvent, {}, ctx, mockResolveInfo),
			).rejects.toMatchObject({
				extensions: expect.objectContaining({
					code: "invalid_arguments",
				}),
			});
		});

		it("throws TalawaGraphQLError when both first and last are provided", async () => {
			await expect(
				agendaFoldersResolver(
					mockEvent,
					{ first: 1, last: 1 },
					ctx,
					mockResolveInfo,
				),
			).rejects.toMatchObject({
				extensions: expect.objectContaining({
					code: "invalid_arguments",
				}),
			});
		});
	});

	describe("errors", () => {
		it("returns empty connection when cursor belongs to another event", async () => {
			// simulate a valid cursor for a folder that does not belong to the event
			const otherFolder = { ...mockAgendaFolders[0], eventId: "other-event" };
			const cursor = createCursor({
				id: otherFolder.id,
				name: otherFolder.name,
			});

			mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue(
				[],
			);
			const result = (await agendaFoldersResolver(
				mockEvent,
				{ first: 1, cursor },
				ctx,
				mockResolveInfo,
			)) as Connection;

			expect(result.edges).toHaveLength(0);
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
		});

		it("throws TalawaGraphQLError when cursor has invalid format (forward)", async () => {
			const invalidCursor = "not-a-valid-base64url-cursor";

			mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue(
				[],
			);

			await expect(
				agendaFoldersResolver(
					mockEvent,
					{ first: 10, after: invalidCursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toMatchObject({
				extensions: expect.objectContaining({
					code: "invalid_arguments",
					issues: expect.arrayContaining([
						expect.objectContaining({
							argumentPath: ["after"],
							message: "Not a valid cursor.",
						}),
					]),
				}),
			});
		});

		it("throws TalawaGraphQLError when cursor has invalid format (backward)", async () => {
			const invalidCursor = "not-a-valid-base64url-cursor";

			mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue(
				[],
			);

			await expect(
				agendaFoldersResolver(
					mockEvent,
					{ last: 10, before: invalidCursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toMatchObject({
				extensions: expect.objectContaining({
					code: "invalid_arguments",
					issues: expect.arrayContaining([
						expect.objectContaining({
							argumentPath: ["before"],
							message: "Not a valid cursor.",
						}),
					]),
				}),
			});
		});

		it("throws error when cursor points to non-existent resource (forward)", async () => {
			const cursor = createCursor({
				id: "00000000-0000-4000-8000-999999999999",
				name: "Ghost Folder",
			});

			mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue(
				[],
			);

			await expect(
				agendaFoldersResolver(
					mockEvent,
					{ first: 10, after: cursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toMatchObject({
				extensions: expect.objectContaining({
					code: "arguments_associated_resources_not_found",
					issues: expect.arrayContaining([
						expect.objectContaining({
							argumentPath: ["after"],
						}),
					]),
				}),
			});
		});

		it("throws error when cursor points to non-existent resource (backward)", async () => {
			const cursor = createCursor({
				id: "00000000-0000-4000-8000-999999999999",
				name: "Ghost Folder",
			});

			mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue(
				[],
			);

			await expect(
				agendaFoldersResolver(
					mockEvent,
					{ last: 10, before: cursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toMatchObject({
				extensions: expect.objectContaining({
					code: "arguments_associated_resources_not_found",
					issues: expect.arrayContaining([
						expect.objectContaining({
							argumentPath: ["before"],
						}),
					]),
				}),
			});
		});

		it("returns empty connection when no agenda folders (backward)", async () => {
			mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue(
				[],
			);

			const result = (await agendaFoldersResolver(
				mockEvent,
				{ last: 10 },
				ctx,
				mockResolveInfo,
			)) as Connection;

			expect(result.edges).toHaveLength(0);
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
			expect(result.pageInfo.endCursor).toBeNull();
		});
	});
});
