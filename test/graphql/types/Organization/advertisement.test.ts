import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import {
	Mutation_createAdvertisement,
	Mutation_createOrganization,
	Query_advertisements,
} from "../../../routes/graphql/documentNodes";
import { server } from "../../../server";
import { mercuriusClient } from "../../types/client";
import { Query_currentUser } from "../documentNodes";

const { accessToken: authToken } = await getAdminAuthViaRest(server);
assertToBeNonNullish(authToken);
const currentUserResult = await mercuriusClient.query(Query_currentUser, {
	headers: { authorization: `bearer ${authToken}` },
});
const adminUserId = currentUserResult.data?.currentUser?.id;
assertToBeNonNullish(adminUserId);

async function createOrg(): Promise<string | undefined> {
	const createOrgResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: `Advertisements Test Org ${faker.string.uuid()}`,
					description: "Org to test advertisements",
					countryCode: "us",
					state: "CA",
					city: "San Francisco",
					postalCode: "94101",
					addressLine1: "100 Test St",
					addressLine2: "Suite 1",
				},
			},
		},
	);
	return createOrgResult.data?.createOrganization?.id;
}

suite("Organization.advertisement Field with Completion Status", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const orgId = await createOrg();
			assertToBeNonNullish(orgId);

			const result = await mercuriusClient.query(Query_advertisements, {
				variables: {
					id: orgId,
					first: 10,
					after: null,
					last: null,
					before: null,
					where: {
						isCompleted: false,
					},
				},
			});

			expect(result.data?.organization?.advertisements?.edges).toBeUndefined();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["organization", "advertisements"],
					}),
				]),
			);
		});
	});

	suite("when there are no advertisements", () => {
		test("should return an empty active ads connection", async () => {
			const orgId = await createOrg();
			assertToBeNonNullish(orgId);

			const adminId = adminUserId;
			assertToBeNonNullish(adminId);

			const resultOfActiveAds = await mercuriusClient.query(
				Query_advertisements,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						id: orgId,
						first: 10,
						after: null,
						last: null,
						before: null,
						where: {
							isCompleted: false,
						},
					},
				},
			);

			const activeAdvertisements =
				resultOfActiveAds.data?.organization?.advertisements;
			assertToBeNonNullish(activeAdvertisements);

			expect(activeAdvertisements.edges).toHaveLength(0);
			expect(activeAdvertisements.pageInfo).toEqual({
				hasNextPage: false,
				hasPreviousPage: false,
				startCursor: null,
				endCursor: null,
			});
		});
		test("should return an empty complete ads connection", async () => {
			const orgId = await createOrg();
			assertToBeNonNullish(orgId);

			const adminId = adminUserId;
			assertToBeNonNullish(adminId);

			const resultOfCompletedAds = await mercuriusClient.query(
				Query_advertisements,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						id: orgId,
						first: 10,
						after: null,
						last: null,
						before: null,
						where: {
							isCompleted: false,
						},
					},
				},
			);

			const completedAdvertisements =
				resultOfCompletedAds.data?.organization?.advertisements;
			assertToBeNonNullish(completedAdvertisements);

			expect(completedAdvertisements.edges).toHaveLength(0);
			expect(completedAdvertisements.pageInfo).toEqual({
				hasNextPage: false,
				hasPreviousPage: false,
				startCursor: null,
				endCursor: null,
			});
		});
	});

	suite("when there are advertisements", () => {
		test("should return the active ads in the connection", async () => {
			const orgId = await createOrg();
			assertToBeNonNullish(orgId);

			const adminId = adminUserId;
			assertToBeNonNullish(adminId);

			await mercuriusClient.mutate(Mutation_createAdvertisement, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: "Linux session",
						type: "banner",
						startAt: new Date("2025-02-02").toISOString(),
						endAt: new Date("2030-02-02").toISOString(),
						description: "learn about basics",
						attachments: undefined,
					},
				},
			});

			const resultOfActiveAds = await mercuriusClient.query(
				Query_advertisements,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						id: orgId,
						first: 10,
						after: null,
						last: null,
						before: null,
						where: {
							isCompleted: false,
						},
					},
				},
			);

			const activeAdvertisements =
				resultOfActiveAds.data?.organization?.advertisements;
			assertToBeNonNullish(activeAdvertisements);

			expect(activeAdvertisements.edges).toHaveLength(1);
			expect(activeAdvertisements.pageInfo.hasNextPage).toEqual(false);
			expect(activeAdvertisements.pageInfo.hasPreviousPage).toEqual(false);
			expect(activeAdvertisements.pageInfo.startCursor).not.toEqual(null);
			expect(activeAdvertisements.pageInfo.endCursor).not.toEqual(null);
		});
		test("should return the completed ads in the connection", async () => {
			const orgId = await createOrg();
			assertToBeNonNullish(orgId);

			const adminId = adminUserId;
			assertToBeNonNullish(adminId);

			await mercuriusClient.mutate(Mutation_createAdvertisement, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: "Linux session",
						type: "banner",
						startAt: new Date("2025-01-01").toISOString(),
						endAt: new Date("2025-02-02").toISOString(),
						description: "learn about basics",
						attachments: undefined,
					},
				},
			});

			const resultOfCompletedAds = await mercuriusClient.query(
				Query_advertisements,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						id: orgId,
						first: 10,
						after: null,
						last: null,
						before: null,
						where: {
							isCompleted: true,
						},
					},
				},
			);

			const completedAdvertisements =
				resultOfCompletedAds.data?.organization?.advertisements;
			assertToBeNonNullish(completedAdvertisements);

			expect(completedAdvertisements.edges).toHaveLength(1);
			expect(completedAdvertisements.pageInfo.hasNextPage).toEqual(false);
			expect(completedAdvertisements.pageInfo.hasPreviousPage).toEqual(false);
			expect(completedAdvertisements.pageInfo.startCursor).not.toEqual(null);
			expect(completedAdvertisements.pageInfo.endCursor).not.toEqual(null);
		});
		test("should return all ads when isCompleted is not specified", async () => {
			const orgId = await createOrg();
			assertToBeNonNullish(orgId);

			await mercuriusClient.mutate(Mutation_createAdvertisement, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: "Active Advertisement",
						type: "banner",
						startAt: new Date("2025-01-01").toISOString(),
						endAt: new Date("2030-02-02").toISOString(),
						description: "This is active",
						attachments: undefined,
					},
				},
			});

			await mercuriusClient.mutate(Mutation_createAdvertisement, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: "Completed Advertisement",
						type: "banner",
						startAt: new Date("2025-01-01").toISOString(),
						endAt: new Date("2025-02-02").toISOString(),
						description: "This is completed",
						attachments: undefined,
					},
				},
			});

			const result = await mercuriusClient.query(Query_advertisements, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					id: orgId,
					first: 10,
					after: null,
					last: null,
					before: null,
					where: null,
				},
			});

			const advertisements = result.data?.organization?.advertisements;
			assertToBeNonNullish(advertisements);
			expect(advertisements.edges).toHaveLength(2);
			const adNames = advertisements?.edges?.map(
				(edge: { node?: { name?: string | null } | null } | null) =>
					edge?.node?.name,
			);
			expect(adNames).toContain("Active Advertisement");
			expect(adNames).toContain("Completed Advertisement");
		});
	});

	suite("when pagination is used", () => {
		test("should respect the 'first' parameter in active ads", async () => {
			const orgId = await createOrg();
			assertToBeNonNullish(orgId);

			const adminId = adminUserId;
			assertToBeNonNullish(adminId);

			for (let i = 1; i <= 5; i++) {
				await mercuriusClient.mutate(Mutation_createAdvertisement, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							organizationId: orgId,
							name: `Linux session ${i}`,
							type: "banner",
							startAt: new Date("2025-01-01").toISOString(),
							endAt: new Date("2030-02-02").toISOString(),
							description: `Learn about basics - Session ${i}`,
							attachments: undefined,
						},
					},
				});
			}

			const resultOfAllActiveAds = await mercuriusClient.query(
				Query_advertisements,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						id: orgId,
						first: 4,
						after: null,
						last: null,
						before: null,
						where: {
							isCompleted: false,
						},
					},
				},
			);
			assertToBeNonNullish(resultOfAllActiveAds);

			const activeAdvertisements =
				resultOfAllActiveAds.data?.organization?.advertisements;
			assertToBeNonNullish(activeAdvertisements);
			expect(activeAdvertisements.edges).toHaveLength(4);
			expect(activeAdvertisements.pageInfo.hasNextPage).toBe(true);
		});
		test("should respect the 'first' parameter in completed ads", async () => {
			const orgId = await createOrg();
			assertToBeNonNullish(orgId);

			const adminId = adminUserId;
			assertToBeNonNullish(adminId);

			for (let i = 1; i <= 5; i++) {
				await mercuriusClient.mutate(Mutation_createAdvertisement, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							organizationId: orgId,
							name: `Linux session 2 - Ad ${i}`,
							type: "banner",
							startAt: new Date("2025-01-01").toISOString(),
							endAt: new Date("2025-02-02").toISOString(),
							description: `Learn about basics - Advertisement ${i}`,
							attachments: undefined,
						},
					},
				});
			}

			const resultOfAllCompletedAds = await mercuriusClient.query(
				Query_advertisements,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						id: orgId,
						first: 4,
						after: null,
						last: null,
						before: null,
						where: {
							isCompleted: true,
						},
					},
				},
			);
			assertToBeNonNullish(resultOfAllCompletedAds);

			const completedAdvertisements =
				resultOfAllCompletedAds.data?.organization?.advertisements;
			assertToBeNonNullish(completedAdvertisements);
			expect(completedAdvertisements.edges).toHaveLength(4);
			expect(completedAdvertisements.pageInfo.hasNextPage).toBe(true);
		});
		test("should paginate using the 'after' parameter", async () => {
			const orgId = await createOrg();
			assertToBeNonNullish(orgId);

			for (let i = 1; i <= 5; i++) {
				await mercuriusClient.mutate(Mutation_createAdvertisement, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							organizationId: orgId,
							name: `Cursor Pagination Ad ${i}`,
							type: "banner",
							startAt: new Date("2025-01-01").toISOString(),
							endAt: new Date("2030-02-02").toISOString(),
							description: "test cursor pagination",
							attachments: undefined,
						},
					},
				});
			}

			const firstPageResult = await mercuriusClient.query(
				Query_advertisements,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						id: orgId,
						first: 2,
						after: null,
						last: null,
						before: null,
						where: {
							isCompleted: false,
						},
					},
				},
			);

			const firstPage = firstPageResult.data?.organization?.advertisements;
			assertToBeNonNullish(firstPage);
			expect(firstPage.edges).toHaveLength(2);
			expect(firstPage.pageInfo.hasNextPage).toBe(true);
			const endCursor = firstPage.pageInfo.endCursor;
			assertToBeNonNullish(endCursor);

			const secondPageResult = await mercuriusClient.query(
				Query_advertisements,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						id: orgId,
						first: 2,
						after: endCursor,
						last: null,
						before: null,
						where: {
							isCompleted: false,
						},
					},
				},
			);

			const secondPage = secondPageResult.data?.organization?.advertisements;
			assertToBeNonNullish(secondPage);
			expect(secondPage.edges).toHaveLength(2);
			expect(secondPage.pageInfo.hasNextPage).toBe(true);

			const firstPageAdNames =
				firstPage.edges
					?.filter(
						(edge: { node?: { name?: string | null } | null } | null) =>
							edge?.node != null,
					)
					.map(
						(edge: { node?: { name?: string | null } | null } | null) =>
							edge?.node?.name,
					) ?? [];
			const secondPageAdNames =
				secondPage.edges
					?.filter(
						(edge: { node?: { name?: string | null } | null } | null) =>
							edge?.node != null,
					)
					.map(
						(edge: { node?: { name?: string | null } | null } | null) =>
							edge?.node?.name,
					) ?? [];

			if (secondPageAdNames) {
				for (const name of secondPageAdNames) {
					expect(firstPageAdNames).not.toContain(name);
				}
			}
		});
		test("should handle invalid pagination parameters gracefully", async () => {
			const orgId = await createOrg();
			assertToBeNonNullish(orgId);

			await mercuriusClient.mutate(Mutation_createAdvertisement, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: "Test Ad 1",
						type: "banner",
						startAt: new Date("2025-01-01").toISOString(),
						endAt: new Date("2030-02-02").toISOString(),
						description: "test ad",
						attachments: undefined,
					},
				},
			});

			await mercuriusClient.mutate(Mutation_createAdvertisement, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: "Test Ad 2",
						type: "banner",
						startAt: new Date("2025-01-01").toISOString(),
						endAt: new Date("2030-02-02").toISOString(),
						description: "test ad",
						attachments: undefined,
					},
				},
			});

			const invalidParamsResult = await mercuriusClient.query(
				Query_advertisements,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						id: orgId,
						first: 5,
						after: null,
						last: 5,
						before: null,
						where: {
							isCompleted: false,
						},
					},
				},
			);

			expect(invalidParamsResult.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: expect.stringMatching(/invalid|error|bad_request/i),
						}),
					}),
				]),
			);
		});
		test("should return error with invalid cursor for before parameter", async () => {
			const orgId = await createOrg();
			assertToBeNonNullish(orgId);

			await mercuriusClient.mutate(Mutation_createAdvertisement, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: "Invalid Cursor Test Ad",
						type: "banner",
						startAt: new Date("2025-01-01").toISOString(),
						endAt: new Date("2030-02-02").toISOString(),
						description: "test invalid cursor",
						attachments: undefined,
					},
				},
			});

			const result = await mercuriusClient.query(Query_advertisements, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					id: orgId,
					first: null,
					after: null,
					last: 5,
					before: "invalid-cursor",
					where: {
						isCompleted: false,
					},
				},
			});

			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: expect.stringMatching(/invalid|error|bad_request/i),
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["before"],
								}),
							]),
						}),
					}),
				]),
			);
		});
	});
	suite("checking advertisement node data", () => {
		test("should return the correct advertisement fields", async () => {
			const orgId = await createOrg();
			assertToBeNonNullish(orgId);

			const adName = "Test Fields Advertisement";
			const adType = "banner";
			const adDescription = "Testing advertisement fields";
			const startDate = new Date("2025-01-01").toISOString();
			const endDate = new Date("2030-02-02").toISOString();

			await mercuriusClient.mutate(Mutation_createAdvertisement, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: adName,
						type: adType,
						startAt: startDate,
						endAt: endDate,
						description: adDescription,
						attachments: undefined,
					},
				},
			});

			const result = await mercuriusClient.query(Query_advertisements, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					id: orgId,
					first: 1,
					after: null,
					last: null,
					before: null,
					where: {
						isCompleted: false,
					},
				},
			});

			const advertisements = result.data?.organization?.advertisements;
			assertToBeNonNullish(advertisements);
			expect(advertisements.edges).toHaveLength(1);

			const adNode = advertisements?.edges?.[0]?.node;
			assertToBeNonNullish(adNode);
			expect(adNode.name).toEqual(adName);
			expect(adNode.type).toEqual(adType);
			expect(adNode.description).toEqual(adDescription);
			expect(adNode.startAt).toBeDefined();
			expect(adNode.endAt).toBeDefined();
			expect(adNode.organization?.id).toEqual(orgId);
			expect(adNode.attachments).toEqual([]);
		});
	});
});
