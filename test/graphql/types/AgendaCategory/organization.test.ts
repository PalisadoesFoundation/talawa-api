import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaCategory as AgendaCategoryType } from "~/src/graphql/types/AgendaCategory/AgendaCategory";
import { resolveOrganization } from "~/src/graphql/types/AgendaCategory/organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("AgendaCategory.organization resolver", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	const mockCategory: AgendaCategoryType = {
		id: "category-1",
		name: "Test Category",
		organizationId: "org-1",
		eventId: "event-1",
		createdAt: new Date(),
		updatedAt: new Date(),
		creatorId: "user-1",
		updaterId: "user-2",
	} as AgendaCategoryType;

	beforeEach(() => {
		const result = createMockGraphQLContext(true, "user-1");
		ctx = result.context;
		mocks = result.mocks;
	});

	it("returns organization when it exists", async () => {
		const mockOrganization = {
			id: "org-1",
			name: "Test Organization",
			countryCode: "US",
		};

		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
			mockOrganization as never,
		);

		const result = await resolveOrganization(mockCategory, {}, ctx);

		expect(result).toEqual(mockOrganization);
		expect(
			mocks.drizzleClient.query.organizationsTable.findFirst,
		).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.any(Function),
			}),
		);
	});

	it("throws unexpected error when organization is not found", async () => {
		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
			undefined,
		);

		const logSpy = vi.spyOn(ctx.log, "error");

		await expect(resolveOrganization(mockCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unexpected",
				},
			}),
		);

		expect(logSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda item category's organization id that isn't null.",
		);
	});
});
