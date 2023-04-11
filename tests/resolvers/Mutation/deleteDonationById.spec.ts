import "dotenv/config";
import { Document, Types } from "mongoose";
import { Interface_Donation, Donation } from "../../../src/models";
import { MutationDeleteDonationByIdArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { deleteDonationById as deleteDonationByIdResolver } from "../../../src/resolvers/Mutation/deleteDonationById";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";

let testDonation: Interface_Donation & Document<any, any, Interface_Donation>;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  const testUser = temp[0];

  const testOrganization = temp[1];

  testDonation = await Donation.create({
    amount: 1,
    nameOfOrg: testOrganization!.name,
    nameOfUser: `${testUser!.firstName} ${testUser!.lastName}`,
    orgId: testOrganization!._id,
    payPalId: "payPalId",
    userId: testUser!._id,
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> deleteDonationById", () => {
  it(`returns false if deletion of donation was unsuccessful`, async () => {
    const args: MutationDeleteDonationByIdArgs = {
      id: Types.ObjectId().toString(),
    };

    const deleteDonationByIdPayload = await deleteDonationByIdResolver?.(
      {},
      args,
      {}
    );

    expect(deleteDonationByIdPayload).toEqual({
      success: false,
    });
  });

  it(`returns true if deletion of donation was successful`, async () => {
    const args: MutationDeleteDonationByIdArgs = {
      id: testDonation._id,
    };

    const deleteDonationByIdPayload = await deleteDonationByIdResolver?.(
      {},
      args,
      {}
    );

    expect(deleteDonationByIdPayload).toEqual({
      success: true,
    });
  });
});
