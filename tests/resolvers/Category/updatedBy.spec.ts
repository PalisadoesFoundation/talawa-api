import "dotenv/config";
import { updatedBy as updatedByResolver } from "../../../src/resolvers/Category/updatedBy";
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

describe("resolvers -> Category -> updated", () => {
  it(`returns the user that last updated the parent category`, async () => {
    const parent = testCategory?.toObject();

    const updatedByPayload = await updatedByResolver?.(parent, {}, {});

    const updatedByObject = await User.findOne({
      _id: testUser?._id,
    }).lean();

    expect(updatedByPayload).toEqual(updatedByObject);
  });
});
