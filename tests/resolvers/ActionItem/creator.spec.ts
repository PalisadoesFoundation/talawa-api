import "dotenv/config";
import { creator as creatorResolver } from "../../../src/resolvers/ActionItem/creator";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { User } from "../../../src/models";
import type { TestUserType } from "../../helpers/userAndOrg";
import type { TestActionItemType } from "../../helpers/actionItem";
import { createTestActionItem } from "../../helpers/actionItem";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testActionItem: TestActionItemType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , , testActionItem] = await createTestActionItem();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> ActionItem -> creator", () => {
  it(`returns the creator for parent action item`, async () => {
    const parent = testActionItem?.toObject();

    const createdByPayload = await creatorResolver?.(parent, {}, {});

    const createdByObject = await User.findOne({
      _id: testUser?._id,
    }).lean();

    expect(createdByPayload).toEqual(createdByObject);
  });
});
