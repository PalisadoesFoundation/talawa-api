import "dotenv/config";
import { createdBy as createdByResolver } from "../../../src/resolvers/ActionItemCategory/createdBy";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { User } from "../../../src/models";
import type { TestUserType } from "../../helpers/userAndOrg";
import type { TestActionItemCategoryType } from "../../helpers/actionItemCategory";
import { createTestCategory } from "../../helpers/actionItemCategory";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testCategory: TestActionItemCategoryType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , testCategory] = await createTestCategory();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> ActionItemCategory -> createdBy", () => {
  it(`returns the creator for parent actionItemCategory`, async () => {
    const parent = testCategory?.toObject();

    const createdByPayload = await createdByResolver?.(parent, {}, {});

    const createdByObject = await User.findOne({
      _id: testUser?._id,
    }).lean();

    expect(createdByPayload).toEqual(createdByObject);
  });
});
