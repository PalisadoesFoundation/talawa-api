import "dotenv/config";
import type mongoose from "mongoose";
import { TransactionLog, User } from "../../../src/models";
import type { MutationUpdateLanguageArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  beforeAll,
  afterAll,
  afterEach,
  describe,
  it,
  vi,
  expect,
} from "vitest";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import { wait } from "./acceptAdmin.spec";
import { TRANSACTION_LOG_TYPES } from "../../../src/constants";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

afterEach(() => {
  vi.doUnmock("../../../src/constants");
  vi.resetModules();
});

describe("resolvers -> Mutation -> updateLanguage", () => {
  it(`updates the organization with _id === args.id and returns the updated organization`, async () => {
    const args: MutationUpdateLanguageArgs = {
      languageCode: "newLanguageCode",
    };

    const context = {
      userId: testUser?._id,
    };

    const { updateLanguage: updateLanguageResolver } = await import(
      "../../../src/resolvers/Mutation/updateLanguage"
    );

    const updateLanguagePayload = await updateLanguageResolver?.(
      {},
      args,
      context
    );

    const testUpdateLanguagePayload = await User.findOne({
      _id: testUser?._id,
    }).lean();

    expect(updateLanguagePayload).toEqual(testUpdateLanguagePayload);

    await wait();

    const mostRecentTransactions = await TransactionLog.find()
      .sort({
        createdAt: -1,
      })
      .limit(1);

    expect(mostRecentTransactions[0]).toMatchObject({
      createdBy: context.userId,
      type: TRANSACTION_LOG_TYPES.UPDATE,
      modelName: "User",
    });
  });
});
