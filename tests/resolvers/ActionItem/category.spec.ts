import "dotenv/config";
import { actionItemCategory as actionItemCategoryResolver } from "../../../src/resolvers/ActionItem/actionItemCategory";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { ActionItemCategory } from "../../../src/models";
import type { TestActionItemType } from "../../helpers/actionItem";
import { createTestActionItem } from "../../helpers/actionItem";
import type { TestActionItemCategoryType } from "../../helpers/actionItemCategory";

let MONGOOSE_INSTANCE: typeof mongoose;
let testActionItem: TestActionItemType;
let testCategory: TestActionItemCategoryType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, , testCategory, testActionItem] = await createTestActionItem();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> ActionItem -> actionItemCategory", () => {
  it(`returns the actionItemCategory for parent action item`, async () => {
    const parent = testActionItem?.toObject();

    const actionItemCategoryPayload = await actionItemCategoryResolver?.(
      parent,
      {},
      {}
    );

    const actionItemCategoryObject = await ActionItemCategory.findOne({
      _id: testCategory?._id,
    }).lean();

    expect(actionItemCategoryPayload).toEqual(actionItemCategoryObject);
  });
});
