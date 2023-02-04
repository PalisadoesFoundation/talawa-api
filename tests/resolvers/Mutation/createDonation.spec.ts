import "dotenv/config";
import { MutationCreateDonationArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { createDonation as createDonationResolver } from "../../../src/resolvers/Mutation/createDonation";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  testOrganizationType,
  testUserType,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";

let testUser: testUserType;
let testOrganization: testOrganizationType;

beforeAll(async () => {
  await connect("TALAWA_TESING_DB");
  const resultsArray = await createTestUserAndOrganization();

  testUser = resultsArray[0];
  testOrganization = resultsArray[1];
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> createDonation", () => {
  it(`creates the donation and returns it`, async () => {
    const args: MutationCreateDonationArgs = {
      amount: 1,
      nameOfOrg: testOrganization!.name,
      nameOfUser: `${testUser!.firstName} ${testUser!.lastName}`,
      orgId: testOrganization!._id,
      payPalId: "payPalId",
      userId: testUser!._id,
    };

    const createDonationPayload = await createDonationResolver?.({}, args, {});

    expect(createDonationPayload).toEqual(
      expect.objectContaining({
        amount: 1,
        nameOfOrg: testOrganization!.name,
        nameOfUser: `${testUser!.firstName} ${testUser!.lastName}`,
        orgId: testOrganization!._id,
        payPalId: "payPalId",
        userId: testUser!._id,
      })
    );
  });
});
