import "dotenv/config";
import { MutationCreateDonationArgs } from "../../../src/types/generatedGraphQLTypes";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { createDonation as createDonationResolver } from "../../../src/resolvers/Mutation/createDonation";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  testOrganizationType,
  testUserType,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";

let testUser: testUserType;
let testOrganization: testOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  const resultsArray = await createTestUserAndOrganization();

  testUser = resultsArray[0];
  testOrganization = resultsArray[1];
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
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
