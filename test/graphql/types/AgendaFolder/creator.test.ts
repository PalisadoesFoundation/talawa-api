import type { GraphQLObjectType, GraphQLResolveInfo } from "graphql";
import { describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { schemaManager } from "~/src/graphql/schemaManager";
import type { AgendaFolder as AgendaFolderType } from "~/src/graphql/types/AgendaFolder/AgendaFolder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { createMockGraphQLContext } from "../../../_Mocks_/mockContextCreator/mockContextCreator";

const createParent = (
	overrides: Partial<AgendaFolderType> = {},
): AgendaFolderType =>
	({
		id: "folder-1",
		name: "Test Folder",
		eventId: "event-1",
		creatorId: "creator-1",
		updatedAt: new Date("2024-01-01T00:00:00.000Z"),
		createdAt: new Date("2024-01-01T00:00:00.000Z"),
		parentFolderId: null,
		isAgendaItemFolder: true,
		...overrides,
	}) as AgendaFolderType;

async function agendaFolderCreatorResolver(
	parent: AgendaFolderType,
	_args: Record<string, never>,
	context: GraphQLContext,
) {
	const schema = await schemaManager.buildInitialSchema();
	const agendaFolderType = schema.getType("AgendaFolder") as GraphQLObjectType;
	const fields = agendaFolderType.getFields();
	if (!fields.creator) {
		throw new Error("AgendaFolder.creator field not found");
	}
	const creatorField = fields.creator;
	return creatorField.resolve?.(
		parent,
		{},
		context,
		undefined as unknown as GraphQLResolveInfo,
	);
}

describe("AgendaFolder.creator resolver", () => {
	it("throws unauthenticated when current client is not authenticated", async () => {
		const parent = createParent();
		const { context } = createMockGraphQLContext(false);

		await expect(
			agendaFolderCreatorResolver(parent, {}, context),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("throws unauthenticated when current user is not found", async () => {
		const parent = createParent();
		const { context, mocks } = createMockGraphQLContext(true, "user-1");

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			undefined,
		);
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			id: "event-1",
			startAt: new Date().toISOString(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		} as never);

		await expect(
			agendaFolderCreatorResolver(parent, {}, context),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("logs and throws unexpected when event is not found", async () => {
		const parent = createParent();
		const { context, mocks } = createMockGraphQLContext(true, "user-1");

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-1",
			role: "regular",
		} as never);
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce(
			undefined,
		);

		const logErrorSpy = context.log.error;

		await expect(
			agendaFolderCreatorResolver(parent, {}, context),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);

		expect(logErrorSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda folder's event id that isn't null.",
		);
	});

	it("throws unauthorized_action when user is neither global admin nor organization admin and has no membership", async () => {
		const parent = createParent();
		const { context, mocks } = createMockGraphQLContext(true, "user-1");

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-1",
			role: "regular",
		} as never);
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			id: "event-1",
			startAt: new Date().toISOString(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		} as never);

		await expect(
			agendaFolderCreatorResolver(parent, {}, context),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("throws unauthorized_action when membership is not administrator", async () => {
		const parent = createParent();
		const { context, mocks } = createMockGraphQLContext(true, "user-1");

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-1",
			role: "regular",
		} as never);
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			id: "event-1",
			startAt: new Date().toISOString(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [
					{
						role: "member",
					},
				],
			},
		} as never);

		await expect(
			agendaFolderCreatorResolver(parent, {}, context),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("returns null when creatorId is null for authorized administrator user", async () => {
		const parent = createParent({ creatorId: null });
		const { context, mocks } = createMockGraphQLContext(true, "admin-1");

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "admin-1",
			role: "administrator",
		} as never);
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			id: "event-1",
			startAt: new Date().toISOString(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		} as never);

		const result = await agendaFolderCreatorResolver(parent, {}, context);
		expect(result).toBeNull();
	});

	it("returns current user when creatorId equals current user id", async () => {
		const parent = createParent({ creatorId: "user-1" });
		const { context, mocks } = createMockGraphQLContext(true, "user-1");

		const currentUser = {
			id: "user-1",
			role: "administrator",
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			currentUser as never,
		);
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			id: "event-1",
			startAt: new Date().toISOString(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		} as never);

		const result = await agendaFolderCreatorResolver(parent, {}, context);
		expect(result).toEqual(currentUser);
	});

	it("fetches and returns creator when different from current user and user is org admin", async () => {
		const parent = createParent({ creatorId: "creator-2" });
		const { context, mocks } = createMockGraphQLContext(true, "user-1");

		const currentUser = {
			id: "user-1",
			role: "regular",
		};

		const creatorUser = {
			id: "creator-2",
			role: "member",
		};

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(currentUser as never)
			.mockResolvedValueOnce(creatorUser as never);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			id: "event-1",
			startAt: new Date().toISOString(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [
					{
						role: "administrator",
					},
				],
			},
		} as never);

		const result = await agendaFolderCreatorResolver(parent, {}, context);
		expect(result).toEqual(creatorUser);
	});

	it("logs and throws unexpected when creator record is missing", async () => {
		const parent = createParent({ creatorId: "creator-2" });
		const { context, mocks } = createMockGraphQLContext(true, "user-1");

		const currentUser = {
			id: "user-1",
			role: "administrator",
		};

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(currentUser as never)
			.mockResolvedValueOnce(undefined as never);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			id: "event-1",
			startAt: new Date().toISOString(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		} as never);

		const logErrorSpy = context.log.error;

		await expect(
			agendaFolderCreatorResolver(parent, {}, context),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);

		expect(logErrorSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda folder's creator id that isn't null.",
		);
	});
});
