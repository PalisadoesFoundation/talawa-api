import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaFolder as AgendaFolderType } from "~/src/graphql/types/AgendaFolder/AgendaFolder";
import { resolveOrganization } from "~/src/graphql/types/AgendaFolder/organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("AgendaFolder.organization resolver", () => {
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
			name: "Test Folder",
			description: null,
			organizationId: "org-123",
			eventId: "event-123",
			parentFolderId: null,
			sequence: 1,
			isAgendaItemFolder: true,
			isDefaultFolder: false,
			createdAt: new Date("2024-01-01T00:00:00.000Z"),
			updatedAt: new Date("2024-01-02T00:00:00.000Z"),
			creatorId: "creator-123",
			updaterId: "updater-123",
		};
	});

	it("should return organization when organization exists", async () => {
		const mockOrganization = {
			id: "org-123",
			name: "Test Organization",
			countryCode: "US",
		};

		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
			mockOrganization,
		);

		const result = await resolveOrganization(mockAgendaFolder, {}, ctx);

		expect(result).toEqual(mockOrganization);
	});

	it("should throw unexpected error when organization does not exist", async () => {
		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
			undefined,
		);

		await expect(
			resolveOrganization(mockAgendaFolder, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda item folder's organization id that isn't null.",
		);
	});

	it("should query organizationsTable with correct organizationId filter", async () => {
		const mockOrganization = {
			id: "org-123",
			name: "Test Organization",
			countryCode: "US",
		};

		(
			mocks.drizzleClient.query.organizationsTable.findFirst as ReturnType<
				typeof vi.fn
			>
		).mockImplementation(({ where }) => {
			expect(where).toBeDefined();

			const mockFields = { id: "org-field-id" };
			const mockOperators = {
				eq: vi.fn((a, b) => ({ [a]: b })),
			};

			const whereResult = where(mockFields, mockOperators);
			expect(whereResult).toEqual({
				[mockFields.id]: mockAgendaFolder.organizationId,
			});

			return Promise.resolve(mockOrganization);
		});

		const result = await resolveOrganization(mockAgendaFolder, {}, ctx);
		expect(result).toEqual(mockOrganization);
	});

	it("should propagate database errors", async () => {
		const dbError = new Error("Database failure");

		mocks.drizzleClient.query.organizationsTable.findFirst.mockRejectedValue(
			dbError,
		);

		await expect(
			resolveOrganization(mockAgendaFolder, {}, ctx),
		).rejects.toThrow(dbError);
	});

	it("should not mutate parent object", async () => {
		const originalParent = { ...mockAgendaFolder };

		const mockOrganization = {
			id: "org-123",
			name: "Test Organization",
			countryCode: "US",
		};

		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
			mockOrganization,
		);

		await resolveOrganization(mockAgendaFolder, {}, ctx);

		expect(mockAgendaFolder).toEqual(originalParent);
	});
});
