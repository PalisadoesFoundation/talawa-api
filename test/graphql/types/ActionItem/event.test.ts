// resolveEvent.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveEvent } from "~/src/graphql/types/ActionItem/event";
import type { Event } from "~/src/graphql/types/Event/Event";
import { createMockDrizzleClient } from "../../../_Mocks_/drizzleClientMock";

// Define the shape returned by usersTable.findFirst
interface UserRecord {
	id: string;
	role: string;
	organizationMembershipsWhereMember: { role: string }[];
}

// Extend Event to include the raw attachments relation
type RawEvent = Event & { attachmentsWhereEvent: unknown[] };

describe("resolveEvent", () => {
	let ctx: GraphQLContext;
	let parent: { eventId: string | null; organizationId: string };
	let usersFindFirst: Mock<() => Promise<UserRecord | undefined>>;
	let eventsFindFirst: Mock<() => Promise<RawEvent | undefined>>;

	beforeEach(() => {
		parent = { eventId: "evt-123", organizationId: "org-abc" };

		const mockDrizzle = createMockDrizzleClient();
		usersFindFirst = mockDrizzle.query.usersTable.findFirst as Mock<
			() => Promise<UserRecord | undefined>
		>;
		eventsFindFirst = mockDrizzle.query.eventsTable.findFirst as Mock<
			() => Promise<RawEvent | undefined>
		>;

		ctx = {
			currentClient: {
				isAuthenticated: true,
				user: { id: "user-1" },
			},
			drizzleClient: mockDrizzle,
			log: { error: vi.fn() },
		} as unknown as GraphQLContext;
	});

	it("throws unauthenticated if not logged in", async () => {
		ctx.currentClient.isAuthenticated = false;
		await expect(resolveEvent(parent, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unauthenticated" },
		});
	});

	it("throws unauthenticated if user record not found", async () => {
		usersFindFirst.mockResolvedValue(undefined);

		await expect(resolveEvent(parent, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unauthenticated" },
		});
	});

	it("throws unauthorized_action if not sys‑ or org‑admin", async () => {
		usersFindFirst.mockResolvedValue({
			id: "user-1",
			role: "member",
			organizationMembershipsWhereMember: [],
		});

		await expect(resolveEvent(parent, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unauthorized_action" },
		});
	});

	it("throws arguments_associated_resources_not_found if event lookup fails", async () => {
		// First, stub user as administrator to pass auth
		usersFindFirst.mockResolvedValue({
			id: "user-1",
			role: "administrator",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		});
		// Then stub the event lookup to return nothing
		eventsFindFirst.mockResolvedValue(undefined);

		await expect(resolveEvent(parent, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "arguments_associated_resources_not_found" },
		});
		expect(ctx.log.error).toHaveBeenCalled();
	});

	it("returns the event with attachments when all checks pass", async () => {
		usersFindFirst.mockResolvedValue({
			id: "user-1",
			role: "member",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		});

		// Construct a minimal Event object, then cast to RawEvent
		const fakeEvent = {
			id: "evt-123",
			organizationId: "org-abc",
			name: "n/a",
			createdAt: new Date(),
			creatorId: null,
			description: null,
			updatedAt: null,
			updaterId: null,
			startAt: new Date(),
			endAt: new Date(),
			attachmentsWhereEvent: [{ id: "att-1" }, { id: "att-2" }],
		} as unknown as RawEvent;

		eventsFindFirst.mockResolvedValue(fakeEvent);

		const result = await resolveEvent(parent, {}, ctx);

		expect(result).toBeTruthy();
		expect(result?.id).toEqual(fakeEvent.id);
		// The resolver maps attachmentsWhereEvent → attachments
		expect((result as Event & { attachments: unknown[] }).attachments).toEqual(
			fakeEvent.attachmentsWhereEvent,
		);
	});
});
