import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { Event } from "~/src/graphql/types/Event/Event";
import { resolveAgendaItems } from "~/src/graphql/types/Event/agendaItems";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

type MockDrizzleClient = {
	query: {
		usersTable: { findFirst: ReturnType<typeof vi.fn> };
		agendaFoldersTable: { findMany: ReturnType<typeof vi.fn> };
		agendaItemsTable: { findMany: ReturnType<typeof vi.fn> };
	};
};

describe("resolveAgendaItems - Unit Tests", () => {
	let ctx: GraphQLContext;
	let parent: Event;
	let mocks: MockDrizzleClient;

	beforeEach(() => {
		mocks = {
			query: {
				usersTable: { findFirst: vi.fn() },
				agendaFoldersTable: { findMany: vi.fn() },
				agendaItemsTable: { findMany: vi.fn() },
			},
		};
		ctx = {
			currentClient: {
				isAuthenticated: true,
				user: { id: "user-1" },
			},
			drizzleClient: mocks,
			log: { error: vi.fn() },
		} as unknown as GraphQLContext;
		parent = {
			id: "event-1",
			organizationId: "org-1",
		} as Event;
	});

	it("should throw unauthenticated error if user is not logged in", async () => {
		ctx.currentClient.isAuthenticated = false;
		await expect(resolveAgendaItems(parent, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("should throw unauthenticated error if user not found", async () => {
		mocks.query.usersTable.findFirst.mockResolvedValue(undefined);
		await expect(resolveAgendaItems(parent, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("should throw unauthorized error if user lacks valid membership", async () => {
		mocks.query.usersTable.findFirst.mockResolvedValue({
			role: "member",
			organizationMembershipsWhereMember: [],
		});
		await expect(resolveAgendaItems(parent, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
		);
	});

	it("should return empty array if no folders found", async () => {
		mocks.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		});
		mocks.query.agendaFoldersTable.findMany.mockResolvedValue([]);
		const result = await resolveAgendaItems(parent, {}, ctx);
		expect(result).toEqual([]);
	});

	it("should return agenda items for valid user and folders", async () => {
		mocks.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		});
		mocks.query.agendaFoldersTable.findMany.mockResolvedValue([
			{ id: "folder-1" },
			{ id: "folder-2" },
		]);
		mocks.query.agendaItemsTable.findMany.mockResolvedValue([
			{ id: "item-1" },
			{ id: "item-2" },
		]);
		const result = await resolveAgendaItems(parent, {}, ctx);
		expect(result).toEqual([{ id: "item-1" }, { id: "item-2" }]);
	});

	it("should pass through TalawaGraphQLError without wrapping", async () => {
		const originalError = new TalawaGraphQLError({
			message: "Custom error",
			extensions: { code: "unexpected" },
		});
		mocks.query.usersTable.findFirst.mockRejectedValueOnce(originalError);
		await expect(resolveAgendaItems(parent, {}, ctx)).rejects.toThrow(
			originalError,
		);
		expect(ctx.log.error).not.toHaveBeenCalled();
	});
});
