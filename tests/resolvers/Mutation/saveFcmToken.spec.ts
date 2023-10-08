import "dotenv/config";
import type mongoose from "mongoose";
import { User } from "../../../src/models";
import type { MutationSaveFcmTokenArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { saveFcmToken as saveFcmTokenResolver } from "../../../src/resolvers/Mutation/saveFcmToken";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestUserType } from "../../helpers/user";
import { createTestUserFunc } from "../../helpers/user";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUserFunc();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> saveFcmToken", () => {
  it(`saves the FCM token and returns true`, async () => {
    const args: MutationSaveFcmTokenArgs = {
      token: "fcmToken",
    };

    const context = {
      userId: testUser?.id,
    };

    const saveFcmTokenPayload = await saveFcmTokenResolver?.({}, args, context);

    expect(saveFcmTokenPayload).toEqual(true);

    const testSaveFcmTokenPayload = await User.findOne({
      _id: testUser?._id,
    })
      .select("token")
      .lean();

    expect(testSaveFcmTokenPayload?.token).toEqual("fcmToken");
  });
});
