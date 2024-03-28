import "dotenv/config";
import { creator as creatorResolver } from "../../../src/resolvers/Fund/creator";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestFundType } from "../../helpers/Fund";
import { createTestFund } from "../../helpers/Fund";
import type { TestUserType } from "../../helpers/userAndOrg";
import { User } from "../../../src/models";

let testFund: TestFundType;
let testUser: TestUserType;

let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , testFund] = await createTestFund();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Fund -> creator", () => {
  it(`returns the creator for parent fund`, async () => {
    const parent = testFund?.toObject();

    const createdByPayload = await creatorResolver?.(parent, {}, {});

    const createdByObject = await User.findOne({
      _id: testUser?._id,
    }).lean();

    expect(createdByPayload).toEqual(createdByObject);
  });
});
