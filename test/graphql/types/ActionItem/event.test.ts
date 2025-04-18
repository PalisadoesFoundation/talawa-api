import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveEvent } from "~/src/graphql/types/ActionItem/event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Fake ActionItem shape
interface FakeActionItem {
	eventId: string | null;
}

describe("resolveEvent", () => {
	let ctx: GraphQLContext;
	let mockFindFirst: Mock;
	const parentWithNull: FakeActionItem = { eventId: null };
	const parentWithId: FakeActionItem = { eventId: "evt-123" };
	const fakeEvent = {
		id: "evt-123",
		title: "Test Event",
		attachmentsWhereEvent: [{ id: "att-1" }, { id: "att-2" }],
	};

	beforeEach(() => {
		mockFindFirst = vi.fn();
		ctx = {
			drizzleClient: {
				query: {
					eventsTable: { findFirst: mockFindFirst },
				},
			},
			log: { error: vi.fn() },
			currentClient: { isAuthenticated: true, user: { id: "user-xyz" } },
		} as unknown as GraphQLContext;
	});

	it("returns null when eventId is null", async () => {
		const result = await resolveEvent(parentWithNull, {}, ctx);
		expect(result).toBeNull();
		expect(mockFindFirst).not.toHaveBeenCalled();
	});

	it("returns event with attachments when found", async () => {
		mockFindFirst.mockResolvedValue(fakeEvent);
		const result = await resolveEvent(parentWithId, {}, ctx);
		expect(result).toEqual({
			...fakeEvent,
			attachments: fakeEvent.attachmentsWhereEvent,
		});
		expect(ctx.log.error).not.toHaveBeenCalled();
	});

	it("logs error and throws unexpected when event not found", async () => {
		mockFindFirst.mockResolvedValue(null);
		await expect(resolveEvent(parentWithId, {}, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);
		await expect(resolveEvent(parentWithId, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unexpected" },
		});
		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned no row for action item's eventId that isn't null.",
		);
	});
});
