import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { Advertisement as AdvertisementType } from "~/src/graphql/types/Advertisement/Advertisement";
import { advertisementOrganization } from "~/src/graphql/types/Advertisement/organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

type OrganizationType = {
	id: string;
	name: string;
	createdAt?: Date;
	updatedAt?: Date | null;
};

describe("Advertisement Resolver - Organization Field", () => {
	let ctx: GraphQLContext;
	let mockAdvertisement: AdvertisementType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	const mockOrganization: OrganizationType = {
		id: "org-123",
		name: "Test Organization",
		createdAt: new Date(),
		updatedAt: null,
	};

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;

		mockAdvertisement = {
			id: "advert-123",
			name: "Test Advertisement",
			createdAt: new Date(),
			updatedAt: null,
			creatorId: "user-123",
			updaterId: null,
			description: "Test description",
			endAt: new Date(),
			startAt: new Date(),
			type: "banner",
			organizationId: "org-123",
			attachments: [],
		};
	});

	it("should return the organization when it exists", async () => {
		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
			mockOrganization,
		);

		const result = await advertisementOrganization(mockAdvertisement, {}, ctx);

		expect(result).toEqual(mockOrganization);
		expect(
			mocks.drizzleClient.query.organizationsTable.findFirst,
		).toHaveBeenCalledTimes(1);
	});

	it("should throw unexpected error when organization does not exist", async () => {
		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
			undefined,
		);

		await expect(async () => {
			await advertisementOrganization(mockAdvertisement, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);
	});

	it("should log an error when organization does not exist", async () => {
		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
			undefined,
		);

		const logErrorSpy = vi.spyOn(ctx.log, "error");

		await expect(async () => {
			await advertisementOrganization(mockAdvertisement, {}, ctx);
		}).rejects.toThrow();

		expect(logErrorSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an advertisement's organization id that isn't null.",
		);
	});

	it("should call where function correctly", async () => {
		const organizationId = "org-123";
		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
			mockOrganization,
		);

		await advertisementOrganization(mockAdvertisement, {}, ctx);

		expect(
			mocks.drizzleClient.query.organizationsTable.findFirst,
		).toHaveBeenCalledTimes(1);

		const calls = (
			mocks.drizzleClient.query.organizationsTable.findFirst as ReturnType<
				typeof vi.fn
			>
		).mock.calls;
		expect(calls.length).toBe(1);

		// Extract the `where` function
		const whereFn = calls[0]?.[0]?.where;
		expect(whereFn).toBeDefined();

		// Mock field conditions
		const mockFields = { id: organizationId };
		const mockOperators = { eq: vi.fn((a, b) => ({ field: a, value: b })) };

		// Call the `where` function
		whereFn(mockFields, mockOperators);
		expect(mockOperators.eq).toHaveBeenCalledWith(
			mockFields.id,
			organizationId,
		);
	});
});
