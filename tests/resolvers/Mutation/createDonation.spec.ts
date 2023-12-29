import "dotenv/config";
import type { MutationCreateDonationArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { createDonation as createDonationResolver } from "../../../src/resolvers/Mutation/createDonation";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import { wait } from "./acceptAdmin.spec";
import { TransactionLog } from "../../../src/models";
import { TRANSACTION_LOG_TYPES } from "../../../src/constants";

let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultsArray = await createTestUserAndOrganization();

  testUser = resultsArray[0];
  testOrganization = resultsArray[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createDonation", () => {
  it(`creates the donation and returns it`, async () => {
    const args: MutationCreateDonationArgs = {
      amount: 1,
      nameOfOrg: testOrganization?.name ?? "",
      nameOfUser: `${testUser?.firstName} ${testUser?.lastName}`,
      orgId: testOrganization?._id,
      payPalId: "payPalId",
      userId: testUser?._id,
    };

    const createDonationPayload = await createDonationResolver?.({}, args, {});

    expect(createDonationPayload).toEqual(
      expect.objectContaining({
        amount: 1,
        nameOfOrg: testOrganization?.name,
        nameOfUser: `${testUser?.firstName} ${testUser?.lastName}`,
        orgId: testOrganization?._id,
        payPalId: "payPalId",
        userId: testUser?._id,
      })
    );

    await wait();

    const mostRecentTransactions = await TransactionLog.find()
      .sort({
        createdAt: -1,
      })
      .limit(1);

    expect(mostRecentTransactions[0]).toMatchObject({
      createdBy: testUser?._id,
      type: TRANSACTION_LOG_TYPES.CREATE,
      modelName: "Donation",
    });
  });
});
