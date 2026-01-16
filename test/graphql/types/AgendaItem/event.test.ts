import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaItem as AgendaItemType } from "~/src/graphql/types/AgendaItem/AgendaItem";
import { resolveEvent } from "~/src/graphql/types/AgendaItem/event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("AgendaItem.event resolver", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	const mockAgendaItem: AgendaItemType = {
		id: "agenda-item-1",
		name: "Item",
		eventId: "event-1",
		folderId: "folder-1",
		type: "general",
		sequence: 1,
		description: null,
		duration: null,
		categoryId: "category-1",
		createdAt: new Date(),
		updatedAt: new Date(),
		creatorId: "user-1",
		updaterId: "user-1",
		key: null,
		notes: null,
	} as AgendaItemType;

	beforeEach(() => {
		const result = createMockGraphQLContext(true, "user-1");
		ctx = result.context;
		mocks = result.mocks;
	});

	it("should return event with attachments when event exists", async () => {
		const mockEvent = {
			id: "event-1",
			name: "Event",
			attachmentsWhereEvent: [{ id: "att-1" }, { id: "att-2" }],
		};

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
			mockEvent as never,
		);

		const result = await resolveEvent(mockAgendaItem, {}, ctx);

		expect(result).toEqual({
			...mockEvent,
			attachments: mockEvent.attachmentsWhereEvent,
		});

		expect(mocks.drizzleClient.query.eventsTable.findFirst).toHaveBeenCalled();
	});

	it("should throw unexpected error when event does not exist", async () => {
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
			undefined,
		);

		const logSpy = vi.spyOn(ctx.log, "error");

		await expect(resolveEvent(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);

		expect(logSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda item's event id that isn't null.",
		);
	});
});
