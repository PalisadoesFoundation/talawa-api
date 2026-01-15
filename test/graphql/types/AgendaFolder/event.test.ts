import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaFolder as AgendaFolderType } from "~/src/graphql/types/AgendaFolder/AgendaFolder";
import { resolveEvent } from "~/src/graphql/types/AgendaFolder/event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("AgendaFolder Resolver - event field", () => {
	let ctx: GraphQLContext;
	let mockAgendaFolder: AgendaFolderType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		mockAgendaFolder = {
			id: "folder-123",
			name: "Test Folder",
			description: null,
			organizationId: "org-123",
			eventId: "event-123",
			sequence: 1,
			isDefaultFolder: false,
			createdAt: new Date("2024-01-01T00:00:00.000Z"),
			updatedAt: new Date("2024-01-02T00:00:00.000Z"),
			creatorId: "creator-123",
			updaterId: "updater-123",
		} as AgendaFolderType;

		const { context, mocks: newMocks } = createMockGraphQLContext(true);
		ctx = context;
		mocks = newMocks;
	});

	it("should return event with attachments mapped correctly", async () => {
		const mockEvent = {
			id: "event-123",
			name: "Test Event",
			startAt: new Date(),
			attachmentsWhereEvent: [
				{ id: "att-1", name: "file.pdf" },
				{ id: "att-2", name: "image.png" },
			],
		};

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
			mockEvent as never,
		);

		const result = await resolveEvent(mockAgendaFolder, {}, ctx);

		expect(result).toEqual(
			expect.objectContaining({
				id: "event-123",
				attachments: mockEvent.attachmentsWhereEvent,
			}),
		);
	});

	it("should throw unexpected error if event does not exist", async () => {
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
			undefined,
		);

		const logSpy = vi.spyOn(ctx.log, "error");

		await expect(resolveEvent(mockAgendaFolder, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);

		expect(logSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda folder's event id that isn't null.",
		);
	});

	it("should query events table with correct eventId filter", async () => {
		mocks.drizzleClient.query.eventsTable.findFirst.mockImplementation(
			async (args?: unknown) => {
				const { where } = args as {
					where: (
						fields: Record<string, unknown>,
						operators: Record<string, unknown>,
					) => unknown;
				};

				const mockFields = { id: "id-field" };
				const mockOperators = {
					eq: (a: unknown, b: unknown) => ({ [String(a)]: b }),
				};

				const whereResult = where(mockFields, mockOperators);

				expect(whereResult).toEqual({
					[mockFields.id]: mockAgendaFolder.eventId,
				});

				return {
					id: "event-123",
					attachmentsWhereEvent: [],
				} as never;
			},
		);

		await resolveEvent(mockAgendaFolder, {}, ctx);
	});

	it("should include attachmentsWhereEvent relation in query", async () => {
		mocks.drizzleClient.query.eventsTable.findFirst.mockImplementation(
			async (args?: unknown) => {
				const { with: withClause } = args as {
					with?: {
						attachmentsWhereEvent?: boolean;
					};
				};

				expect(withClause).toEqual({
					attachmentsWhereEvent: true,
				});

				return {
					id: "event-123",
					attachmentsWhereEvent: [],
				} as never;
			},
		);

		await resolveEvent(mockAgendaFolder, {}, ctx);
	});

	it("should handle database errors gracefully", async () => {
		const dbError = new Error("Database failure");

		mocks.drizzleClient.query.eventsTable.findFirst.mockRejectedValue(dbError);

		await expect(resolveEvent(mockAgendaFolder, {}, ctx)).rejects.toThrow(
			dbError,
		);
	});
});
