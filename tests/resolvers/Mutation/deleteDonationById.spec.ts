import "dotenv/config";
import type { Document } from "mongoose";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { InterfaceDonation } from "../../../src/models";
import { Donation } from "../../../src/models";
import type {
  MutationDeleteDonationByIdArgs,
  TransactionLog,
} from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { deleteDonationById as deleteDonationByIdResolver } from "../../../src/resolvers/Mutation/deleteDonationById";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import { TRANSACTION_LOG_TYPES } from "../../../src/constants";

import { getTransactionLogs } from "../../../src/resolvers/Query/getTransactionLogs";

let testDonation: InterfaceDonation & Document<any, any, InterfaceDonation>;
let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];

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
      id: Types.ObjectId().toString(),
    };
    const context = {
      userId: testUser?._id,
    };

    const deleteDonationByIdPayload = await deleteDonationByIdResolver?.(
      {},
      args,
      context
    );

    expect(deleteDonationByIdPayload).toEqual({
      success: false,
    });
  });

  it(`returns true if deletion of donation was successful`, async () => {
    const args: MutationDeleteDonationByIdArgs = {
      id: testDonation._id,
    };
    const context = {
      userId: testUser?._id,
    };
    const deleteDonationByIdPayload = await deleteDonationByIdResolver?.(
      {},
      args,
      context
    );

    expect(deleteDonationByIdPayload).toEqual({
      success: true,
    });
    const mostRecentTransactions = getTransactionLogs!({}, {}, {})!;

    expect((mostRecentTransactions as TransactionLog[])[0]).toMatchObject({
      createdBy: testUser?._id.toString(),
      type: TRANSACTION_LOG_TYPES.DELETE,
      model: "Donation",
    });
  });
});
