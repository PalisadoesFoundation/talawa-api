import "dotenv/config";
import type { Document } from "mongoose";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type {
  InterfaceAdvertisement,
  InterfaceDonation,
} from "../../../src/models";
import { Advertisement } from "../../../src/models";
import type {
  MutationDeleteDonationByIdArgs,
  TransactionLog,
} from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import { deleteAdvertisementById } from "../../../src/resolvers/Mutation/deleteAdvertisementById";

import { TRANSACTION_LOG_TYPES } from "../../../src/constants";
import { getTransactionLogs } from "../../../src/resolvers/Query/getTransactionLogs";

let testAdvertisement: InterfaceAdvertisement &
  Document<any, any, InterfaceDonation>;
let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
  const testOrganization = temp[1];
  testAdvertisement = await Advertisement.create({
    orgId: testOrganization?._id,
    endDate: new Date(),
    link: "http://example.com",
    startDate: new Date(),
    type: "POPUP",
    name: "Cookies at just $5 for a packet",
    creatorId: temp[0]?._id,
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> deleteAdvertiementById", () => {
  it(`returns false if deletion of advertisement was unsuccessful`, async () => {
    const args: MutationDeleteDonationByIdArgs = {
      id: Types.ObjectId().toString(),
    };
    const context = {
      userId: testUser?._id,
    };

    const deleteDonationByIdPayload = await deleteAdvertisementById?.(
      {},
      args,
      context
    );

    expect(deleteDonationByIdPayload).toEqual({
      success: false,
    });
  });

  it(`returns true if deletion of ads was successful`, async () => {
    const args: MutationDeleteDonationByIdArgs = {
      id: testAdvertisement._id,
    };
    const context = {
      userId: testUser?._id,
    };
    const deleteAdvertisementByIdPayload = await deleteAdvertisementById?.(
      {},
      args,
      context
    );

    expect(deleteAdvertisementByIdPayload).toEqual({
      success: true,
    });

    const mostRecentTransactions = getTransactionLogs!({}, {}, {})!;

    expect((mostRecentTransactions as TransactionLog[])[0]).toMatchObject({
      createdBy: testUser?._id.toString(),
      type: TRANSACTION_LOG_TYPES.DELETE,
      model: "Advertisement",
    });
  });
});
