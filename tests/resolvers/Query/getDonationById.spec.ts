import "dotenv/config";
import { connect, disconnect } from "../../../src/db";
import { getDonationById as getDonationByIdResolver } from "../../../src/resolvers/Query/getDonationById";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { QueryGetDonationByIdArgs } from "../../../src/types/generatedGraphQLTypes";
import { testDonationType, createTestDonation} from "../../helpers/donation";
import { testUserType, testOrganizationType } from "../../helpers/userAndOrg";

let testUser: testUserType;
let testOrganization: testOrganizationType;
let testDonation: testDonationType;

beforeAll(async () => {
  await connect();
  [testUser, testOrganization, testDonation] = await createTestDonation();
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> getDonationById", () => {
  it(`returns the donation with _id === args.id`, async () => {
    const args: QueryGetDonationByIdArgs = {
      id: testDonation._id,
    };

    const getDonationByIdPayload = await getDonationByIdResolver?.(
      {},
      args,
      {}
    );

    expect(getDonationByIdPayload).toEqual(testDonation.toObject());
  });
});
