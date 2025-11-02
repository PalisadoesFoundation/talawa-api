import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { FundCampaign as FundCampaignType } from "~/src/graphql/types/FundCampaign/FundCampaign";
import { resolveUpdater } from "~/src/graphql/types/FundCampaign/updater";

describe("FundCampaign Resolver - updater field", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let mockFundCampaign: FundCampaignType;

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
		mockFundCampaign = {
			id: "campaign-123",
			fundId: "fund-456",
			updaterId: "user-456",
			creatorId: "creator-123",
			name: "Test Campaign",
			goalAmount: 10000,
			currencyCode: "USD",
			startAt: new Date(),
			endAt: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
		} as FundCampaignType;

		vi.clearAllMocks();
	});

	describe("Authentication and Authorization", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(resolveUpdater(mockFundCampaign, {}, ctx)).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
				}),
			);
		});

		it("should throw unauthenticated error when current user lookup returns undefined", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				undefined,
			);

			await expect(resolveUpdater(mockFundCampaign, {}, ctx)).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
				}),
			);
		});
	});

	describe("Fund Validation", () => {
		it("should log error and throw unexpected when associated fund is not found", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
				id: "user-123",
				role: "administrator",
			});
			mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValueOnce(
				undefined,
			);

			await expect(resolveUpdater(mockFundCampaign, {}, ctx)).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unexpected",
					}),
				}),
			);

			expect(ctx.log.error).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for a fund campaign's fund id that isn't null.",
			);
		});
	});

	describe("Authorization Checks", () => {
		it("should throw unauthorized_action when user and org membership are not administrators", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
				id: "user-123",
				role: "member",
			});
			mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValueOnce({
				organization: { membershipsWhereOrganization: [{ role: "member" }] },
			});

			await expect(resolveUpdater(mockFundCampaign, {}, ctx)).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthorized_action",
					}),
				}),
			);
		});

		it("should throw unauthorized_action when user has no organization memberships", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
				id: "user-123",
				role: "member",
			});
			mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValueOnce({
				organization: { membershipsWhereOrganization: [] },
			});

			await expect(resolveUpdater(mockFundCampaign, {}, ctx)).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthorized_action",
					}),
				}),
			);
		});

		it("should allow access when user is organization administrator (not system admin)", async () => {
			mocks.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce({
					id: "user-123",
					role: "member",
				})
				.mockResolvedValueOnce({
					id: "user-456",
					role: "member",
				});
			mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValueOnce({
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			});

			const result = await resolveUpdater(mockFundCampaign, {}, ctx);
			expect(result).toBeDefined();
			expect(result).toEqual({ id: "user-456", role: "member" });
		});
	});

	describe("Updater Retrieval", () => {
		it("should return null when updaterId is null", async () => {
			mockFundCampaign.updaterId = null;
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
				id: "user-123",
				role: "administrator",
			});
			mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValueOnce({
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			});

			const result = await resolveUpdater(mockFundCampaign, {}, ctx);
			expect(result).toBeNull();
		});

		it("should return current user when updaterId equals current authenticated user id", async () => {
			mockFundCampaign.updaterId = "user-123";
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
				id: "user-123",
				role: "administrator",
			});
			mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValueOnce({
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			});

			const result = await resolveUpdater(mockFundCampaign, {}, ctx);
			expect(result).toEqual({ id: "user-123", role: "administrator" });
		});

		it("should return the existing updater user when updaterId is different from current user", async () => {
			mocks.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce({
					id: "user-123",
					role: "administrator",
				})
				.mockResolvedValueOnce({
					id: "user-456",
					role: "member",
				});
			mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValueOnce({
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			});

			const result = await resolveUpdater(mockFundCampaign, {}, ctx);
			expect(result).toEqual({ id: "user-456", role: "member" });
		});
	});

	describe("Edge Cases and Error Scenarios", () => {
		it("should log error and throw unexpected when updater user does not exist", async () => {
			mocks.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce({
					id: "user-123",
					role: "administrator",
				})
				.mockResolvedValueOnce(undefined);
			mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValueOnce({
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			});

			await expect(resolveUpdater(mockFundCampaign, {}, ctx)).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unexpected",
					}),
				}),
			);

			expect(ctx.log.error).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for a fund campaign's updater id that isn't null.",
			);
		});

		it("should call usersTable.findFirst twice when updaterId differs from currentUserId", async () => {
			mockFundCampaign.updaterId = "user-456";

			mocks.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce({ id: "user-123", role: "administrator" })
				.mockResolvedValueOnce({ id: "user-456", role: "member" });

			mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValueOnce({
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			});

			await resolveUpdater(mockFundCampaign, {}, ctx);

			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledTimes(2);
			expect(
				mocks.drizzleClient.query.fundsTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});
	});

	describe("Database Query Validation", () => {
		it("should query usersTable with correct where clause for current user", async () => {
			const currentUserId = "user-123";

			mocks.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce({
					id: currentUserId,
					role: "administrator",
				})
				.mockResolvedValueOnce({
					id: "user-456",
					role: "member",
				});

			mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValueOnce({
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			});

			await resolveUpdater(mockFundCampaign, {}, ctx);

			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledWith({
				where: expect.any(Function),
			});

			// Verify the where clause logic
			const whereCall = (mocks.drizzleClient.query.usersTable.findFirst as Mock)
				.mock.calls[0]?.[0];
			const whereFn = whereCall?.where;

			if (whereFn) {
				const mockFields = { id: "field-id" };
				const mockOperators = {
					eq: vi.fn((field, value) => ({ field, value })),
				};

				whereFn(mockFields, mockOperators);
				expect(mockOperators.eq).toHaveBeenCalledWith(
					"field-id",
					currentUserId,
				);
			}
		});

		it("should query fundsTable with correct fundId in where clause", async () => {
			const currentUserId = "user-123";
			const fundId = "fund-456";

			mocks.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce({
					id: currentUserId,
					role: "administrator",
				})
				.mockResolvedValueOnce({
					id: "user-456",
					role: "member",
				});

			mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValueOnce({
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			});

			await resolveUpdater(mockFundCampaign, {}, ctx);

			expect(
				mocks.drizzleClient.query.fundsTable.findFirst,
			).toHaveBeenCalledWith({
				columns: { isTaxDeductible: true },
				with: expect.objectContaining({
					organization: expect.objectContaining({
						columns: { countryCode: true },
						with: expect.objectContaining({
							membershipsWhereOrganization: expect.objectContaining({
								columns: { role: true },
								where: expect.any(Function),
							}),
						}),
					}),
				}),
				where: expect.any(Function),
			});

			// Verify the where clause logic
			const whereCall = (mocks.drizzleClient.query.fundsTable.findFirst as Mock)
				.mock.calls[0]?.[0];
			const whereFn = whereCall?.where;

			if (whereFn) {
				const mockFields = { id: "field-id" };
				const mockOperators = {
					eq: vi.fn((field, value) => ({ field, value })),
				};

				whereFn(mockFields, mockOperators);
				expect(mockOperators.eq).toHaveBeenCalledWith("field-id", fundId);
			}
		});

		it("should verify membershipsWhereOrganization where clause uses currentUserId", async () => {
			const currentUserId = "user-123";

			mocks.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce({
					id: currentUserId,
					role: "member",
				})
				.mockResolvedValueOnce({
					id: "user-456",
					role: "member",
				});

			mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValueOnce({
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			});

			await resolveUpdater(mockFundCampaign, {}, ctx);

			const calls = (mocks.drizzleClient.query.fundsTable.findFirst as Mock)
				.mock.calls;

			if (calls.length > 0) {
				const callArgs = calls[0]?.[0];
				const whereFn =
					callArgs?.with?.organization?.with?.membershipsWhereOrganization
						?.where;

				expect(whereFn).toBeDefined();

				if (whereFn) {
					const mockFields = { memberId: "field-memberId" };
					const mockOperators = {
						eq: vi.fn((field, value) => ({ field, value })),
					};

					whereFn(mockFields, mockOperators);

					expect(mockOperators.eq).toHaveBeenCalledWith(
						"field-memberId",
						currentUserId,
					);
				}
			}
		});
	});
});
