import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createFund,
	Mutation_createFundCampaign,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteFundCampaign,
} from "../documentNodes";

const { accessToken: authToken } = await getAdminAuthViaRest(server);
assertToBeNonNullish(authToken);

suite("Mutation deleteFundCampaign", () => {
	//// 1. Unauthenticated
	suite("when the user is not authenticated", () => {
		test("should return unauthenticated error", async () => {
			const result = await mercuriusClient.mutate(Mutation_deleteFundCampaign, {
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.deleteFundCampaign).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
						path: ["deleteFundCampaign"],
					}),
				]),
			);
		});
	});

	//// 2. Invalid arguments
	suite("when invalid arguments are provided", () => {
		test("should return invalid_arguments error for malformed UUID", async () => {
			const result = await mercuriusClient.mutate(Mutation_deleteFundCampaign, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: "not-a-valid-uuid",
					},
				},
			});

			expect(result.data?.deleteFundCampaign).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
						path: ["deleteFundCampaign"],
					}),
				]),
			);
		});
	});

	//// 3. Fund campaign does not exist
	suite("when the fund campaign does not exist", () => {
		test("should return arguments_associated_resources_not_found error", async () => {
			const result = await mercuriusClient.mutate(Mutation_deleteFundCampaign, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.deleteFundCampaign).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["deleteFundCampaign"],
					}),
				]),
			);
		});
	});

	//// 4. Unauthorized user
	suite("when the user is not an administrator", () => {
		test("should return unauthorized_action_on_arguments_associated_resources error", async () => {
			const user = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						emailAddress: faker.internet.email(),
						password: faker.internet.password(),
						role: "regular",
						name: faker.person.fullName(),
						isEmailAddressVerified: true,
					},
				},
			});

			assertToBeNonNullish(user.data?.createUser);
			assertToBeNonNullish(user.data.createUser.authenticationToken);
			const userToken = user.data.createUser.authenticationToken;

			const org = await mercuriusClient.mutate(Mutation_createOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: `org-${faker.string.uuid()}`,
						countryCode: "id",
						isUserRegistrationRequired: false,
					},
				},
			});

			assertToBeNonNullish(org.data?.createOrganization);
			const organizationId = org.data.createOrganization.id;

			const fund = await mercuriusClient.mutate(Mutation_createFund, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Test Fund",
						organizationId,
						isTaxDeductible: false,
					},
				},
			});

			assertToBeNonNullish(fund.data?.createFund);
			const fundId = fund.data.createFund.id;

			const campaign = await mercuriusClient.mutate(
				Mutation_createFundCampaign,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `admin-campaign-${faker.string.uuid()}`,
							fundId,
							goalAmount: 5000,
							currencyCode: "USD",
							startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
							endAt: new Date(
								Date.now() + 10 * 24 * 60 * 60 * 1000,
							).toISOString(),
						},
					},
				},
			);

			assertToBeNonNullish(campaign.data?.createFundCampaign);
			const campaignId = campaign.data.createFundCampaign.id;

			const result = await mercuriusClient.mutate(Mutation_deleteFundCampaign, {
				headers: { authorization: `bearer ${userToken}` },
				variables: {
					input: {
						id: campaignId,
					},
				},
			});

			expect(result.data?.deleteFundCampaign).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
						path: ["deleteFundCampaign"],
					}),
				]),
			);
		});
	});

	//// 5. Administrator deletes fund campaign
	suite("when the user is an administrator", () => {
		test("should successfully delete fund campaign", async () => {
			const org = await mercuriusClient.mutate(Mutation_createOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: `admin-org-${faker.string.uuid()}`,
						countryCode: "id",
						isUserRegistrationRequired: false,
					},
				},
			});

			assertToBeNonNullish(org.data?.createOrganization);
			const organizationId = org.data.createOrganization.id;

			const fund = await mercuriusClient.mutate(Mutation_createFund, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Admin Fund",
						organizationId,
						isTaxDeductible: false,
					},
				},
			});

			assertToBeNonNullish(fund.data?.createFund);
			const fundId = fund.data.createFund.id;

			const campaign = await mercuriusClient.mutate(
				Mutation_createFundCampaign,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `admin-campaign-${faker.string.uuid()}`,
							fundId,
							goalAmount: 5000,
							currencyCode: "USD",
							startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
							endAt: new Date(
								Date.now() + 10 * 24 * 60 * 60 * 1000,
							).toISOString(),
						},
					},
				},
			);

			assertToBeNonNullish(campaign.data?.createFundCampaign);
			const campaignId = campaign.data.createFundCampaign.id;

			const result = await mercuriusClient.mutate(Mutation_deleteFundCampaign, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: campaignId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.deleteFundCampaign);
			expect(result.data.deleteFundCampaign.id).toBe(campaignId);
		});
	});

	//// 6. Organization administrator deletes fund campaign
	suite("when the user is an organization administrator", () => {
		test("should successfully delete fund campaign", async () => {
			// 1. Create a regular user
			const user = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						emailAddress: faker.internet.email(),
						password: faker.internet.password(),
						role: "regular",
						name: faker.person.fullName(),
						isEmailAddressVerified: true,
					},
				},
			});

			assertToBeNonNullish(user.data?.createUser);
			const userToken = user.data.createUser.authenticationToken;
			assertToBeNonNullish(userToken);

			// 2. Create organization (admin creates it)
			const org = await mercuriusClient.mutate(Mutation_createOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: `org-admin-${faker.string.uuid()}`,
						countryCode: "id",
						isUserRegistrationRequired: false,
					},
				},
			});

			assertToBeNonNullish(org.data?.createOrganization);
			const organizationId = org.data.createOrganization.id;

			assertToBeNonNullish(user.data?.createUser.user);
			const memberId = user.data.createUser.user.id;
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId,
						memberId,
						role: "administrator",
					},
				},
			});

			// 3. Create fund
			const fund = await mercuriusClient.mutate(Mutation_createFund, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Org Admin Fund",
						organizationId,
						isTaxDeductible: false,
					},
				},
			});

			assertToBeNonNullish(fund.data?.createFund);
			const fundId = fund.data.createFund.id;

			// 4. Create campaign
			const campaign = await mercuriusClient.mutate(
				Mutation_createFundCampaign,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `org-admin-campaign-${faker.string.uuid()}`,
							fundId,
							goalAmount: 5000,
							currencyCode: "USD",
							startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
							endAt: new Date(
								Date.now() + 10 * 24 * 60 * 60 * 1000,
							).toISOString(),
						},
					},
				},
			);

			assertToBeNonNullish(campaign.data?.createFundCampaign);
			const campaignId = campaign.data.createFundCampaign.id;

			// 5. Delete campaign as ORG ADMIN
			const result = await mercuriusClient.mutate(Mutation_deleteFundCampaign, {
				headers: { authorization: `bearer ${userToken}` },
				variables: {
					input: {
						id: campaignId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.deleteFundCampaign);
			expect(result.data.deleteFundCampaign.id).toBe(campaignId);
		});
	});
});
