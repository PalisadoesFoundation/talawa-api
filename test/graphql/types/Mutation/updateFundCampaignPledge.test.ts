import { faker } from "@faker-js/faker";
import {
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  suite,
  test,
  vi,
} from "vitest";

import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";

import {
  Mutation_createOrganization,
  Mutation_createFund,
  Mutation_createFundCampaign,
  Mutation_createFundCampaignPledge,
  Mutation_createUser,
  Query_signIn,
} from "../documentNodes";

/* ---------- mutation ---------- */
const UpdateFundCampaignPledgeMutation = `
  mutation UpdateFundCampaignPledge($input: MutationUpdateFundCampaignPledgeInput!) {
    updateFundCampaignPledge(input: $input) {
      id
      amount
      note
    }
  }
`;

/* ---------- sign in once (administrator) ---------- */
const signInResult = await mercuriusClient.query(Query_signIn, {
  variables: {
    input: {
      emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
      password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
    },
  },
});

assertToBeNonNullish(signInResult.data?.signIn);
assertToBeNonNullish(signInResult.data.signIn.user);
const adminToken = signInResult.data.signIn.authenticationToken;
const adminUserId = signInResult.data.signIn.user.id;

/* -------------------------------------------------- */

suite("Mutation updateFundCampaignPledge", () => {
  let organizationId: string;
  let fundId: string;
  let campaignId: string;
  let pledgeId: string;

  /* ---------- base setup ---------- */
  beforeAll(async () => {
    /* organization */
    const org = await mercuriusClient.mutate(Mutation_createOrganization, {
      headers: { authorization: `bearer ${adminToken}` },
      variables: {
        input: {
          name: faker.company.name(),
          countryCode: "in",
        },
      },
    });
    assertToBeNonNullish(org.data?.createOrganization);
    organizationId = org.data.createOrganization.id;

    /* fund */
    const fund = await mercuriusClient.mutate(Mutation_createFund, {
      headers: { authorization: `bearer ${adminToken}` },
      variables: {
        input: {
          organizationId,
          name: faker.company.name(),
          isTaxDeductible: true,
        },
      },
    });
    assertToBeNonNullish(fund.data?.createFund);
    fundId = fund.data.createFund.id;

    /* campaign */
    const campaign = await mercuriusClient.mutate(
      Mutation_createFundCampaign,
      {
        headers: { authorization: `bearer ${adminToken}` },
        variables: {
          input: {
            fundId,
            name: faker.lorem.words(3),
            goalAmount: 10_000,
            currencyCode: "INR",
            startAt: new Date().toISOString(),
            endAt: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
        },
      },
    );
    assertToBeNonNullish(campaign.data?.createFundCampaign);
    campaignId = campaign.data.createFundCampaign.id;

    /* pledge */
    const pledge = await mercuriusClient.mutate(
      Mutation_createFundCampaignPledge,
      {
        headers: { authorization: `bearer ${adminToken}` },
        variables: {
          input: {
            pledgerId: adminUserId,
            campaignId,
            amount: 100,
            note: "initial",
          },
        },
      },
    );
    assertToBeNonNullish(pledge.data?.createFundCampaignPledge);
    pledgeId = pledge.data.createFundCampaignPledge.id;
  });

  //// 1. Unauthenticated
  suite("when the user is not authenticated", () => {
    test("should return unauthenticated error", async () => {
      const result = await mercuriusClient.mutate(
        UpdateFundCampaignPledgeMutation,
        {
          variables: {
            input: {
              id: faker.string.uuid(),
              amount: 100,
              note: "test",
            },
          },
        },
      );

      expect(result.data?.updateFundCampaignPledge).toBeNull();
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            extensions: expect.objectContaining({
              code: "unauthenticated",
            }),
            path: ["updateFundCampaignPledge"],
          }),
        ]),
      );
    });
  });

  //// 2. Invalid arguments
  suite("when invalid arguments are provided", () => {
    test("should return invalid_arguments error", async () => {
      const result = await mercuriusClient.mutate(
        UpdateFundCampaignPledgeMutation,
        {
          headers: { authorization: `bearer ${adminToken}` },
          variables: {
            input: {
              id: "not-a-valid-uuid",
              amount: -10,
              note: "invalid",
            },
          },
        },
      );

      expect(result.data?.updateFundCampaignPledge).toBeNull();
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            extensions: expect.objectContaining({
              code: "invalid_arguments",
            }),
            path: ["updateFundCampaignPledge"],
          }),
        ]),
      );
    });
  });

  //// 3. Pledge not found
  suite("when the fund campaign pledge does not exist", () => {
    test("should return arguments_associated_resources_not_found error", async () => {
      const result = await mercuriusClient.mutate(
        UpdateFundCampaignPledgeMutation,
        {
          headers: { authorization: `bearer ${adminToken}` },
          variables: {
            input: {
              id: faker.string.uuid(),
              amount: 500,
              note: "updated",
            },
          },
        },
      );

      expect(result.data?.updateFundCampaignPledge).toBeNull();
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            extensions: expect.objectContaining({
              code: "arguments_associated_resources_not_found",
            }),
            path: ["updateFundCampaignPledge"],
          }),
        ]),
      );
    });
  });

  //// 4. Unauthorized user
  suite("when the user is not admin, org admin, or pledger", () => {
    test("should return unauthorized_action_on_arguments_associated_resources", async () => {
      const user = await mercuriusClient.mutate(Mutation_createUser, {
        headers: { authorization: `bearer ${adminToken}` },
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

      const result = await mercuriusClient.mutate(
        UpdateFundCampaignPledgeMutation,
        {
          headers: { authorization: `bearer ${userToken}` },
          variables: {
            input: {
              id: pledgeId,
              amount: 200,
              note: "updated",
            },
          },
        },
      );

      expect(result.data?.updateFundCampaignPledge).toBeNull();
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            extensions: expect.objectContaining({
              code: "unauthorized_action_on_arguments_associated_resources",
            }),
            path: ["updateFundCampaignPledge"],
          }),
        ]),
      );
    });
  });

  //// 5. Success
  suite("when the pledger updates their own pledge", () => {
    test("should successfully update the pledge", async () => {
      const result = await mercuriusClient.mutate(
        UpdateFundCampaignPledgeMutation,
        {
          headers: { authorization: `bearer ${adminToken}` },
          variables: {
            input: {
              id: pledgeId,
              amount: 300,
              note: "updated pledge",
            },
          },
        },
      );

      expect(result.errors).toBeUndefined();
      assertToBeNonNullish(result.data?.updateFundCampaignPledge);
      expect(result.data.updateFundCampaignPledge.amount).toBe(300);
      expect(result.data.updateFundCampaignPledge.note).toBe("updated pledge");
    });
  });

  //// 6. Database update failure
  suite("when the database update operation fails", () => {
    let originalUpdate: typeof server.drizzleClient.update;

    beforeEach(() => {
      originalUpdate = server.drizzleClient.update;
      server.drizzleClient.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
    });

    afterEach(() => {
      server.drizzleClient.update = originalUpdate;
    });

    test("should return unexpected error", async () => {
      const result = await mercuriusClient.mutate(
        UpdateFundCampaignPledgeMutation,
        {
          headers: { authorization: `bearer ${adminToken}` },
          variables: {
            input: {
              id: pledgeId,
              amount: 999,
              note: "fail",
            },
          },
        },
      );

      expect(result.data?.updateFundCampaignPledge).toBeNull();
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            extensions: expect.objectContaining({
              code: "unexpected",
            }),
            path: ["updateFundCampaignPledge"],
          }),
        ]),
      );
    });
  });
});
