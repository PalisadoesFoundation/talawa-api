import { describe, expect, it, vi } from "vitest";
import type { DrizzleClient } from "~/src/plugins/drizzleClient";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { validateAgendaFolder } from "~/src/utilities/validateAgendaFolder";

// Helper to create a mock drizzle client.
const createMockDrizzleClient = (
	returnValue: { eventId: string; isAgendaItemFolder: boolean } | undefined,
): DrizzleClient => {
	return {
		query: {
			agendaFoldersTable: {
				// We simulate the findFirst query method.
				findFirst: vi.fn().mockResolvedValue(returnValue),
			},
		},
	} as unknown as DrizzleClient;
};

describe("validateAgendaFolder", () => {
	it("throws an error when the agenda folder does not exist", async () => {
		const folderId = "non-existent-folder";
		const eventId = "some-event-id";
		const mockClient = createMockDrizzleClient(undefined);

		await expect(
			validateAgendaFolder(mockClient, folderId, eventId),
		).rejects.toThrowError(TalawaGraphQLError);
	});

	it("throws an error when the agenda folder exists but its eventId does not match the provided eventId", async () => {
		const folderId = "folder-1";
		const eventId = "expected-event";
		// Return a folder with a mismatched eventId.
		const folderData = { eventId: "different-event", isAgendaItemFolder: true };
		const mockClient = createMockDrizzleClient(folderData);

		await expect(
			validateAgendaFolder(mockClient, folderId, eventId),
		).rejects.toThrowError(
			"This action is forbidden on the resources associated to the provided arguments.",
		);
	});

	it("throws an error when the agenda folder exists but is not marked as an agenda item folder", async () => {
		const folderId = "folder-1";
		const eventId = "expected-event";
		// Return a folder that is not a valid agenda folder.
		const folderData = { eventId, isAgendaItemFolder: false };
		const mockClient = createMockDrizzleClient(folderData);

		await expect(
			validateAgendaFolder(mockClient, folderId, eventId),
		).rejects.toThrowError(
			"This action is forbidden on the resources associated to the provided arguments.",
		);
	});

	it("resolves successfully when the agenda folder exists, eventId matches, and is a valid agenda folder", async () => {
		const folderId = "folder-1";
		const eventId = "expected-event";
		const folderData = { eventId, isAgendaItemFolder: true };
		const mockClient = createMockDrizzleClient(folderData);

		await expect(
			validateAgendaFolder(mockClient, folderId, eventId),
		).resolves.toBeUndefined();
	});
});