import "dotenv/config";
import { createdBy as createdByResolver } from "../../../src/resolvers/Category/createdBy";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { User } from "../../../src/models";
import type { TestUserType } from "../../helpers/userAndOrg";
import type { TestCategoryType } from "../../helpers/category";
import { createTestCategory } from "../../helpers/category";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testCategory: TestCategoryType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , testCategory] = await createTestCategory();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Category -> createdBy", () => {
  it(`returns the creator for parent category`, async () => {
    const parent = testCategory?.toObject();

    const createdByPayload = await createdByResolver?.(parent, {}, {});

    const createdByObject = await User.findOne({
      _id: testUser?._id,
    }).lean();

    expect(createdByPayload).toEqual(createdByObject);
  });
});
