import "dotenv/config";
import type mongoose from "mongoose";
import type { Document } from "mongoose";
import { Types } from "mongoose";
import type { InterfaceDonation } from "../../../src/models";
import { Donation } from "../../../src/models";
import type { MutationDeleteDonationByIdArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { deleteDonationById as deleteDonationByIdResolver } from "../../../src/resolvers/Mutation/deleteDonationById";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";

let testDonation: InterfaceDonation &
  Document<unknown, unknown, InterfaceDonation>;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  const testUser = temp[0];

  const testOrganization = temp[1];

  testDonation = await Donation.create({
    amount: 1,
    nameOfOrg: testOrganization?.name,
    nameOfUser: `${testUser?.firstName} ${testUser?.lastName}`,
    orgId: testOrganization?._id,
    payPalId: "payPalId",
    userId: testUser?._id,
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> deleteDonationById", () => {
  it(`returns false if deletion of donation was unsuccessful`, async () => {
    const args: MutationDeleteDonationByIdArgs = {
      id: new Types.ObjectId().toString(),
    };

    const deleteDonationByIdPayload = await deleteDonationByIdResolver?.(
      {},
      args,
      {},
    );

    expect(deleteDonationByIdPayload).toEqual({
      success: false,
    });
  });

  it(`returns true if deletion of donation was successful`, async () => {
    const args: MutationDeleteDonationByIdArgs = {
      id: testDonation._id as string,
    };

    const deleteDonationByIdPayload = await deleteDonationByIdResolver?.(
      {},
      args,
      {},
    );

    expect(deleteDonationByIdPayload).toEqual({
      success: true,
    });
  });
});
