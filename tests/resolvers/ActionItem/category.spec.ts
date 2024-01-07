import "dotenv/config";
import { category as categoryResolver } from "../../../src/resolvers/ActionItem/category";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { Category } from "../../../src/models";
import type { TestActionItemType } from "../../helpers/actionItem";
import { createTestActionItem } from "../../helpers/actionItem";
import type { TestCategoryType } from "../../helpers/category";

let MONGOOSE_INSTANCE: typeof mongoose;
let testActionItem: TestActionItemType;
let testCategory: TestCategoryType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, , testCategory, testActionItem] = await createTestActionItem();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> ActionItem -> category", () => {
  it(`returns the category for parent action item`, async () => {
    const parent = testActionItem?.toObject();

    const categoryPayload = await categoryResolver?.(parent, {}, {});

    const categoryObject = await Category.findOne({
      _id: testCategory?._id,
    }).lean();

    expect(categoryPayload).toEqual(categoryObject);
  });
});
